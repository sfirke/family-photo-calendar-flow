
interface VersionMigration {
  from: string;
  to: string;
  migrate: (data: any) => any;
}

export class EventVersionManager {
  private static readonly MIGRATIONS: VersionMigration[] = [
    // Example migration from 0.9 to 1.0
    {
      from: '0.9',
      to: '1.0',
      migrate: (data: any) => ({
        ...data,
        events: data.events?.map((event: any) => ({
          ...event,
          source: event.source || 'local',
          calendarId: event.calendarId || 'local_calendar',
          calendarName: event.calendarName || 'Family Calendar'
        })) || []
      })
    }
  ];

  static migrateData(data: any, currentVersion: string, targetVersion: string): any {
    let migratedData = { ...data };
    let version = currentVersion;

    // Find and apply migrations in sequence
    while (version !== targetVersion) {
      const migration = this.MIGRATIONS.find(m => m.from === version);
      
      if (!migration) {
        console.warn(`No migration found from version ${version} to ${targetVersion}`);
        break;
      }

      try {
        migratedData = migration.migrate(migratedData);
        version = migration.to;
        console.log(`Migrated data from ${migration.from} to ${migration.to}`);
      } catch (error) {
        console.error(`Migration failed from ${migration.from} to ${migration.to}:`, error);
        break;
      }
    }

    return {
      ...migratedData,
      version: targetVersion
    };
  }

  static isVersionSupported(version: string): boolean {
    const supportedVersions = ['1.0', '0.9'];
    return supportedVersions.includes(version);
  }

  static needsMigration(currentVersion: string, targetVersion: string): boolean {
    return currentVersion !== targetVersion && this.isVersionSupported(currentVersion);
  }
}
