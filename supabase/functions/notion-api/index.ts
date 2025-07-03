
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotionProperty {
  id: string;
  type: string;
  [key: string]: any;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
  url: string;
  created_time: string;
  last_edited_time: string;
}

interface NotionDatabaseResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  location?: string;
  status?: string;
  categories?: string[];
  priority?: string;
  properties: Record<string, any>;
  sourceUrl: string;
  scrapedAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, token, databaseId, url } = await req.json()

    if (!token) {
      throw new Error('Notion integration token is required')
    }

    switch (action) {
      case 'validate':
        return await validateNotionAccess(token, databaseId, url)
      case 'query':
        return await queryNotionDatabase(token, databaseId)
      case 'test':
        return await testNotionDatabase(token, databaseId)
      default:
        throw new Error('Invalid action specified')
    }
  } catch (error) {
    console.error('Notion API error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function validateNotionAccess(token: string, databaseId?: string, url?: string) {
  try {
    // First validate the token by getting user info
    const userResponse = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Invalid Notion token or insufficient permissions')
    }

    const userInfo = await userResponse.json()

    // If database ID or URL is provided, validate access to it
    if (databaseId || url) {
      const extractedId = databaseId || extractDatabaseIdFromUrl(url || '')
      if (!extractedId) {
        throw new Error('Invalid database ID or URL format')
      }

      // Try to access the database
      const dbResponse = await fetch(`https://api.notion.com/v1/databases/${extractedId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
        },
      })

      if (!dbResponse.ok) {
        if (dbResponse.status === 404) {
          throw new Error('Database not found or not shared with integration')
        } else if (dbResponse.status === 403) {
          throw new Error('Integration does not have access to this database')
        } else {
          throw new Error('Failed to access database')
        }
      }

      const database = await dbResponse.json()

      return new Response(
        JSON.stringify({
          success: true,
          userInfo,
          database: {
            id: database.id,
            title: database.title,
            properties: database.properties,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        userInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    throw error
  }
}

async function queryNotionDatabase(token: string, databaseId: string) {
  try {
    const events: CalendarEvent[] = []
    let hasMore = true
    let nextCursor: string | undefined

    while (hasMore) {
      const queryBody: any = {
        page_size: 100,
      }

      if (nextCursor) {
        queryBody.start_cursor = nextCursor
      }

      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to query database: ${response.statusText}`)
      }

      const data: NotionDatabaseResponse = await response.json()

      // Process each page into a calendar event
      for (const page of data.results) {
        const event = transformPageToEvent(page, databaseId)
        if (event) {
          events.push(event)
        }
      }

      hasMore = data.has_more
      nextCursor = data.next_cursor
    }

    return new Response(
      JSON.stringify({
        success: true,
        events,
        metadata: {
          databaseId,
          totalEvents: events.length,
          scrapedAt: new Date().toISOString(),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    throw error
  }
}

async function testNotionDatabase(token: string, databaseId: string) {
  try {
    // Get database metadata
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    })

    if (!dbResponse.ok) {
      throw new Error(`Failed to access database: ${dbResponse.statusText}`)
    }

    const database = await dbResponse.json()

    // Get a few sample pages
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 3 }),
    })

    if (!queryResponse.ok) {
      throw new Error(`Failed to query database: ${queryResponse.statusText}`)
    }

    const queryData = await queryResponse.json()
    const sampleEvents = queryData.results.map((page: NotionPage) => transformPageToEvent(page, databaseId)).filter(Boolean)

    return new Response(
      JSON.stringify({
        success: true,
        database: {
          id: database.id,
          title: database.title,
          properties: database.properties,
          url: database.url,
        },
        sampleEvents,
        totalPages: queryData.results.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    throw error
  }
}

function transformPageToEvent(page: NotionPage, databaseId: string): CalendarEvent | null {
  try {
    const properties = page.properties
    let title = 'Untitled'
    let date: string | null = null
    let time: string | undefined
    let description: string | undefined
    let location: string | undefined
    let status: string | undefined
    let categories: string[] = []
    let priority: string | undefined

    // Extract data from properties
    for (const [key, property] of Object.entries(properties)) {
      const keyLower = key.toLowerCase()

      switch (property.type) {
        case 'title':
          if (property.title && property.title.length > 0) {
            title = property.title.map((t: any) => t.plain_text).join('')
          }
          break

        case 'date':
          if (property.date?.start) {
            const dateString = property.date.start
            date = dateString
            
            // Enhanced time detection logic
            if (dateString.includes('T')) {
              const timePart = dateString.split('T')[1]
              // Check if it's a meaningful time (not just 00:00:00.000+00:00 or similar)
              if (timePart && 
                  !timePart.startsWith('00:00:00') && 
                  !timePart.startsWith('00:00') && 
                  timePart !== '00:00:00.000+00:00') {
                // Extract time in HH:MM format
                const timeMatch = timePart.match(/(\d{2}):(\d{2})/)
                if (timeMatch) {
                  time = `${timeMatch[1]}:${timeMatch[2]}`
                }
              }
              // If no meaningful time found, leave time undefined for all-day treatment
            }
            // If no 'T' in date string, it's definitely a date-only entry (all-day)
          }
          break

        case 'rich_text':
          const richText = property.rich_text?.map((t: any) => t.plain_text).join('') || ''
          if (keyLower.includes('description') || keyLower.includes('note')) {
            description = richText
          } else if (keyLower.includes('location') || keyLower.includes('place')) {
            location = richText
          }
          break

        case 'select':
          const selectValue = property.select?.name
          if (selectValue) {
            if (keyLower.includes('status')) {
              status = selectValue
            } else if (keyLower.includes('priority')) {
              priority = selectValue
            } else {
              categories.push(selectValue)
            }
          }
          break

        case 'multi_select':
          const multiSelectValues = property.multi_select?.map((item: any) => item.name) || []
          if (keyLower.includes('category') || keyLower.includes('tag')) {
            categories.push(...multiSelectValues)
          }
          break
      }
    }

    // Must have a date to be a valid calendar event
    if (!date) {
      console.log(`Skipping event "${title}" - no date found`)
      return null
    }

    console.log(`Processing Notion event: "${title}", date: ${date}, time: ${time || 'undefined (all-day)'}`)

    return {
      id: `notion_${page.id}`,
      title,
      date,
      time, // This will be undefined for all-day events
      description,
      location,
      status,
      categories: categories.length > 0 ? categories : undefined,
      priority,
      properties,
      sourceUrl: page.url || `https://notion.so/${page.id.replace(/-/g, '')}`,
      scrapedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error transforming page to event:', error)
    return null
  }
}

function extractDatabaseIdFromUrl(url: string): string | null {
  // Extract database ID from various Notion URL formats
  const patterns = [
    /notion\.so\/([a-f0-9]{32})/,
    /notion\.so\/.*-([a-f0-9]{32})/,
    /notion\.so\/.*\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1].replace(/-/g, '')
    }
  }

  return null
}
