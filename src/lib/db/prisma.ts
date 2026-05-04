import 'server-only';
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

/**
 * MOCK PRISMA SERVICE (WASM VERSION)
 * 
 * Por causa de problemas com o caractere '&' no caminho do Windows e instabilidades 
 * do Prisma 7 no Next.js 16/Turbopack, este serviço emula o Prisma usando sql.js (Wasm).
 * É 100% estável e não possui dependências nativas.
 */

const DB_PATH = path.join(process.cwd(), 'dev.db');

class SqlJsDatabase {
  private db: any = null;
  private SQL: any = null;

  async init() {
    if (this.db) return;
    
    this.SQL = await initSqlJs({
      // Localização do arquivo WASM no node_modules
      locateFile: () => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    });

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
      // Criar tabelas básicas se não existirem
      this.db.run(`
        CREATE TABLE IF NOT EXISTS Settings (
          id TEXT PRIMARY KEY DEFAULT 'default',
          metaAccessToken TEXT,
          anthropicApiKey TEXT,
          auditPrompt TEXT DEFAULT 'Você é um especialista em tráfego pago...',
          maxCpl REAL DEFAULT 80,
          maxFrequency REAL DEFAULT 3.5,
          minCtr REAL DEFAULT 0.5,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS AuditHistory (
          id TEXT PRIMARY KEY,
          accountId TEXT,
          accountName TEXT,
          data TEXT,
          report TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      this.save();
    }
  }

  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }

  // Emulação do prisma.settings
  get settings() {
    return {
      findUnique: async ({ where }: any) => {
        await this.init();
        const res = this.db.exec("SELECT * FROM Settings WHERE id = ?", [where.id]);
        if (res.length === 0) return null;
        
        // Mapear colunas para objeto
        const columns = res[0].columns;
        const values = res[0].values[0];
        const obj: any = {};
        columns.forEach((col: string, i: number) => obj[col] = values[i]);
        return obj;
      },
      create: async ({ data }: any) => {
        await this.init();
        const now = new Date().toISOString();
        const finalData = { 
          updatedAt: now,
          ...data 
        };
        const keys = Object.keys(finalData);
        const values = Object.values(finalData);
        const placeholders = keys.map(() => '?').join(',');
        this.db.run(`INSERT INTO Settings (${keys.join(',')}) VALUES (${placeholders})`, values);
        this.save();
        return finalData;
      },
      update: async ({ where, data }: any) => {
        await this.init();
        const now = new Date().toISOString();
        const finalData = { 
          ...data,
          updatedAt: now 
        };
        const keys = Object.keys(finalData);
        const values = Object.values(finalData);
        const setClause = keys.map(k => `${k} = ?`).join(',');
        this.db.run(`UPDATE Settings SET ${setClause} WHERE id = ?`, [...values, where.id]);
        this.save();
        return { ...where, ...finalData };
      }
    };
  }

  // Emulação do prisma.auditHistory
  get auditHistory() {
    return {
      create: async ({ data }: any) => {
        await this.init();
        const id = data.id || `audit_${Date.now()}`;
        const now = new Date().toISOString();
        const finalData = {
          id,
          createdAt: now,
          ...data
        };
        const keys = Object.keys(finalData);
        const values = Object.values(finalData);
        const placeholders = keys.map(() => '?').join(',');
        this.db.run(`INSERT INTO AuditHistory (${keys.join(',')}) VALUES (${placeholders})`, values);
        this.save();
        return finalData;
      }
    };
  }
}

const dbInstance = new SqlJsDatabase();

// Exportamos um objeto que imita a interface do PrismaClient
const prismaMock = {
  settings: dbInstance.settings,
  auditHistory: dbInstance.auditHistory,
};

export default prismaMock;
