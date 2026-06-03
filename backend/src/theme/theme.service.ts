import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Database } from 'bun:sqlite';

export interface Theme {
  id?: number;
  name: string;
  gradient: string | null;
  noise: number;
  shadow_x?: number;
  shadow_y?: number;
  shadow_blur?: number;
  shadow_opacity?: number;
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
        shadow_x INTEGER DEFAULT 0,
        shadow_y INTEGER DEFAULT 2,
        shadow_blur INTEGER DEFAULT 4,
        shadow_opacity REAL DEFAULT 0.35,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrations for existing databases
    try {
      this.db.run('ALTER TABLE themes ADD COLUMN shadow_x INTEGER DEFAULT 0');
    } catch (e) {}
    try {
      this.db.run('ALTER TABLE themes ADD COLUMN shadow_y INTEGER DEFAULT 2');
    } catch (e) {}
    try {
      this.db.run('ALTER TABLE themes ADD COLUMN shadow_blur INTEGER DEFAULT 4');
    } catch (e) {}
    try {
      this.db.run('ALTER TABLE themes ADD COLUMN shadow_opacity REAL DEFAULT 0.35');
    } catch (e) {}
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

  async saveTheme(
    name: string,
    gradient: string | null,
    noise: number,
    shadow_x: number = 0,
    shadow_y: number = 2,
    shadow_blur: number = 4,
    shadow_opacity: number = 0.35,
  ): Promise<Theme> {
    // Insert or update on name conflict (UPSERT)
    this.db.run(
      `
      INSERT INTO themes (name, gradient, noise, shadow_x, shadow_y, shadow_blur, shadow_opacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        gradient = excluded.gradient,
        noise = excluded.noise,
        shadow_x = excluded.shadow_x,
        shadow_y = excluded.shadow_y,
        shadow_blur = excluded.shadow_blur,
        shadow_opacity = excluded.shadow_opacity
      `,
      [name, gradient, noise, shadow_x, shadow_y, shadow_blur, shadow_opacity],
    );

    // Retrieve and return the saved theme
    const query = this.db.query('SELECT * FROM themes WHERE name = ?');
    return query.get(name) as Theme;
  }
}
