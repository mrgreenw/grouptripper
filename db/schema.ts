// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const trips=sqliteTable('grouptripper_trip',{id:text('id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull()});
export const accounts=sqliteTable('grouptripper_accounts',{id:text('id').primaryKey(),username:text('username').notNull().unique(),password:text('password').notNull()});
export const sessions=sqliteTable('grouptripper_sessions',{token:text('token').primaryKey(),member:text('member').notNull(),expires:integer('expires').notNull()});
export const limits=sqliteTable('grouptripper_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
