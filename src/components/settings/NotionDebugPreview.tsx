import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, Eye, FileText, Calendar } from 'lucide-react';
import { notionPageScraper } from '@/services/NotionPageScraper';
import { NotionDebugInfo } from '@/services/NotionTableParser';

interface NotionDebugPreviewProps {
  url: string;
  token?: string;
  onClose: () => void;
}

export const NotionDebugPreview: React.FC<NotionDebugPreviewProps> = ({ url, token, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    elements: true,
    data: true,
    analysis: true,
    events: true
  });

  const runDebugScrape = async () => {
    setIsLoading(true);
    setError(null);
    setDebugResult(null);

    try {
      console.log('🐛 Starting debug scrape for URL:', url);
      const result = await notionPageScraper.scrapePageWithDebug(url);
      console.log('🐛 Debug scrape completed:', result);
      setDebugResult(result);
    } catch (error) {
      console.error('❌ Debug scrape failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCellData = (cellData: string[]) => {
    return cellData.length > 0 ? cellData.join(' | ') : '<empty>';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Notion Debug Preview
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">URL: {url}</p>
          {token && (
            <p className="text-sm text-muted-foreground">Token: {token.substring(0, 10)}...</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {!debugResult && !error && (
              <div className="text-center py-8">
                <Button 
                  onClick={runDebugScrape} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isLoading ? 'Analyzing...' : 'Run Debug Analysis'}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will fetch and analyze the Notion page structure
                </p>
              </div>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <Bug className="h-4 w-4" />
                    <span className="font-medium">Debug Analysis Failed</span>
                  </div>
                  <p className="text-sm mt-2">{error}</p>
                </CardContent>
              </Card>
            )}

            {debugResult && (
              <div className="space-y-4">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {debugResult.events.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Events Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {debugResult.debugInfo?.extractedData.allRows.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {debugResult.debugInfo?.parsingStrategy.successRate.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline">
                          {debugResult.debugInfo?.parsingStrategy.strategy || 'unknown'}
                        </Badge>
                        <div className="text-sm text-muted-foreground">Strategy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Found Elements */}
                <Collapsible open={openSections.elements} onOpenChange={() => toggleSection('elements')}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Found Elements
                          </span>
                          {openSections.elements ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium">Total Block Elements:</span>
                              <span className="ml-2">{debugResult.debugInfo?.foundElements.totalBlockElements || 0}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Elements with Columns:</span>
                              <span className="ml-2">{debugResult.debugInfo?.foundElements.elementsWithColumns || 0}</span>
                            </div>
                          </div>
                          
                          {debugResult.debugInfo?.foundElements.sampleElements && (
                            <div>
                              <h4 className="font-medium mb-2">Sample Elements:</h4>
                              <div className="space-y-2">
                                {debugResult.debugInfo.foundElements.sampleElements.map((element: any, index: number) => (
                                  <div key={index} className="p-2 bg-muted rounded text-sm">
                                    <div><strong>Block ID:</strong> {element.blockId}</div>
                                    <div><strong>Columns:</strong> {element.columnCount}</div>
                                    <div><strong>Data:</strong> {formatCellData(element.cellData)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Extracted Data */}
                <Collapsible open={openSections.data} onOpenChange={() => toggleSection('data')}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between">
                          <span>Extracted Data</span>
                          {openSections.data ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Headers:</h4>
                            <div className="flex flex-wrap gap-2">
                              {debugResult.debugInfo?.extractedData.headers?.map((header: string, index: number) => (
                                <Badge key={index} variant="secondary">{header}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">All Rows:</h4>
                            <ScrollArea className="h-64 border rounded">
                              <div className="p-2 space-y-2">
                                {debugResult.debugInfo?.extractedData.allRows?.map((row: any, index: number) => (
                                  <div key={index} className={`p-2 rounded text-sm border-l-4 ${
                                    row.isHeader ? 'border-l-blue-500 bg-blue-50' :
                                    row.isEmpty ? 'border-l-gray-300 bg-gray-50' :
                                    'border-l-green-500 bg-green-50'
                                  }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">Row {row.rowIndex}</Badge>
                                      {row.isHeader && <Badge variant="secondary" className="text-xs">Header</Badge>}
                                      {row.isEmpty && <Badge variant="outline" className="text-xs">Empty</Badge>}
                                    </div>
                                    <div>{formatCellData(row.cellData)}</div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Column Analysis */}
                <Collapsible open={openSections.analysis} onOpenChange={() => toggleSection('analysis')}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between">
                          <span>Column Analysis</span>
                          {openSections.analysis ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(debugResult.debugInfo?.columnAnalysis.detectedMappings || {}).map(([column, mapping]: [string, any]) => (
                            <div key={column} className="p-3 border rounded">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{column}</span>
                                <Badge variant={mapping.type === 'date' ? 'default' : mapping.type === 'title' ? 'secondary' : 'outline'}>
                                  {mapping.type}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Property: {mapping.propertyName}
                              </div>
                              {debugResult.debugInfo?.columnAnalysis.mappingReasons?.[column] && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {debugResult.debugInfo.columnAnalysis.mappingReasons[column]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Event Creation */}
                <Collapsible open={openSections.events} onOpenChange={() => toggleSection('events')}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Event Creation Results
                          </span>
                          {openSections.events ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2 text-green-600">Valid Events ({debugResult.debugInfo?.eventCreation.validEvents?.length || 0}):</h4>
                            <div className="space-y-2">
                              {debugResult.debugInfo?.eventCreation.validEvents?.map((event: any, index: number) => (
                                <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                  <div><strong>Row {event.rowIndex}:</strong> {event.title}</div>
                                  <div className="text-muted-foreground">Date: {new Date(event.date).toLocaleDateString()}</div>
                                  <div className="text-xs text-green-600">{event.reason}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-medium mb-2 text-orange-600">Skipped Rows ({debugResult.debugInfo?.eventCreation.skippedRows?.length || 0}):</h4>
                            <div className="space-y-2">
                              {debugResult.debugInfo?.eventCreation.skippedRows?.map((row: any, index: number) => (
                                <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                  <div><strong>Row {row.rowIndex}:</strong> {formatCellData(row.cellData)}</div>
                                  <div className="text-xs text-orange-600">{row.reason}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
