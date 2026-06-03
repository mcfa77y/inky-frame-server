import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Database } from 'bun:sqlite';

export interface Theme {
  id?: number;
  name: string;
  gradient: string | null;
  noise: number;
  created_at?: string;
}

@Injectable()
export class ThemeService implements OnModuleInit, OnModuleDestroy {
  private db: Database;

  onModuleInit() {
    const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : 'themes.sqlite';
    this.db = new Database(dbPath, { create: true });
    
    // Create the themes table if it doesn't exist
    this.db.run(`
      CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        gradient TEXT,
        noise REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  async getThemes(): Promise<Theme[]> {
    const query = this.db.query('SELECT * FROM themes ORDER BY created_at DESC');
    return query.all() as Theme[];
  }

  async saveTheme(name: string, gradient: string | null, noise: number): Promise<Theme> {
    // Insert or update on name conflict (UPSERT)
    this.db.run(
      `
      INSERT INTO themes (name, gradient, noise)
      VALUES (?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        gradient = excluded.gradient,
        noise = excluded.noise
      `,
      [name, gradient, noise],
    );

    // Retrieve and return the saved theme
    const query = this.db.query('SELECT * FROM themes WHERE name = ?');
    return query.get(name) as Theme;
  }
}
