# Import the database into Microsoft Access

You now have **AL-RAFIQ-DATABASE.xlsx** - one workbook with 14 sheets, each one
ready to become a Microsoft Access table. The first sheet (`_INDEX`) lists every
table, its primary key and how it links to the others.

## What you need
- Microsoft Access (any modern version: 2016, 2019, 2021, 365). Windows only.
- The file `AL-RAFIQ-DATABASE.xlsx` from this project folder.

## Step 1 - Create a new Access database
1. Open Microsoft Access.
2. **File -> New -> Blank database**.
3. Save it (e.g. `AlRafiq.accdb`) in your Documents folder.

## Step 2 - Import each sheet as a table
For **each sheet** in `AL-RAFIQ-DATABASE.xlsx` (skip `_INDEX` itself):

1. **External Data -> New Data Source -> From File -> Excel**.
2. Browse to `AL-RAFIQ-DATABASE.xlsx`, choose **"Import the source data into a new
   table in the current database"**, click **OK**.
3. The wizard opens. Pick the sheet (e.g. `products`), then **Next**.
4. Tick **"First Row Contains Column Headings"**, click **Next**.
5. **IMPORTANT** - row 2 of every sheet shows the recommended Access data type for
   each column (CURRENCY, DATE, MEMO, etc). For best results:
   - Click each column in the wizard and set its **Data Type** to match row 2.
   - Common picks: `id`, `slug`, `sku` -> Short Text; `description`, `notes`,
     `content` -> Long Text (Memo); `price`, `total` -> Currency;
     `created_at`, `date` -> Date/Time; `active` -> Yes/No.
   - After import you can also delete row 2 inside the resulting table.
6. **Next**, choose **"Let Access add primary key"** OR **"Choose my own primary key"**
   and pick the field marked `primary key` in row 2.
7. **Next**, name the table the same as the sheet (e.g. `products`), **Finish**.
8. Repeat for every sheet listed in `_INDEX`.

## Step 3 - Set up relationships (so reports/queries work)
**Database Tools -> Relationships**. Add the tables you imported, then drag fields
to link them as listed in the `_INDEX` sheet:

- `products.category` -> `categories.slug`
- `orders.customer_id` -> `customers.id`
- `order_items.order_id` -> `orders.id`
- `order_items.product_id` -> `products.id`
- `reviews.product_id` -> `products.id`
- `complaints.order_id` -> `orders.id`
- `complaint_events.ticket_id` -> `complaints.id`
- `media_library.product_id` -> `products.id`
- `audit_log.user_id` -> `admin_users.id`

When dragging, tick **Enforce Referential Integrity**.

## Step 4 - Clean up
- Delete the type-hint row (row 2) inside each imported table. Quickest way:
  open the table -> click the leftmost grey cell of that row -> Delete.
- Save.

## Tips
- **Bulk-edit your catalog in Access**, then export it back to CSV/Excel and bulk
  upload into the live website later.
- **Forms & Reports:** use Access **Create -> Form Wizard** to make a clean
  product/customer entry form in minutes. Use **Create -> Report Wizard** for
  monthly sales reports out of the `orders` and `accounts_txn` tables.
- **Queries:** Access's Query Designer can join the tables for things like
  "all orders by Lahore customers in May" without writing SQL.

## Important - Access is NOT the live website's database
Microsoft Access is a desktop database. It cannot serve the live website on cloud
hosting (Render/Railway/cPanel Linux can't connect to a `.accdb` file, and it
won't handle concurrent web traffic). Use it for:

- Offline catalog/customer management.
- Reports and analysis.
- Bulk data preparation before uploading to the live site.

For the **live site's database**, the CTO audit recommends **Supabase (Postgres)**
- managed, scalable, web-friendly. The Access tables you build here use the same
column names, so migrating the data later is straightforward.
