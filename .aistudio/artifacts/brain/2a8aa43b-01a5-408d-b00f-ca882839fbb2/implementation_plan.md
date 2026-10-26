# Implementation Plan: Furniture Catalog Database Schema

## Goal
Establish a minimal, effective database schema for a furniture catalog application, supporting CRUD operations for products (items) and categories (groups).

## Proposed Schema

### 1. Table: `category` (Groups)
This table stores the furniture categories.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | VARCHAR | Category name (e.g., "Living Room", "Bedroom") |
| `description` | TEXT | Optional description |
| `created_at` | TIMESTAMP | Creation time |

### 2. Table: `product` (Items)
This table stores individual furniture items.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `category_id` | UUID | Foreign Key referencing `category(id)` |
| `name` | VARCHAR | Product name |
| `description` | TEXT | Product details/specs |
| `price` | DECIMAL | Product price |
| `image_url` | VARCHAR | URL for the furniture image |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last updated time |

## Implementation Steps

1.  **Define Schema**: Generate the SQL statements to create the `category` and `product` tables in Supabase.
2.  **Execute SQL**: Run the generated SQL in the Supabase SQL Editor to create the tables.
3.  **Integrate Code**: Update `src/lib/supabaseClient.ts` (if exists) or create it, to initialize the Supabase client, and update `src/data/furnitureData.ts` to fetch/save data to/from Supabase instead of local mock data.

Please review this proposed schema and steps. If you agree, click 'Proceed' to apply these changes.
