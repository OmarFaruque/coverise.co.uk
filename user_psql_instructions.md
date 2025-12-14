Okay, I have your `DATABASE_URL` and can provide precise instructions for using `psql`.

Here's how to connect to your database using `psql` and execute the SQL statements:

1.  **Open your terminal.**

2.  **Connect to your PostgreSQL database using the following command.** You will be prompted for a password.

    ```bash
    psql -h ep-still-dawn-a4xygmi7-pooler.us-east-1.aws.neon.tech -U neondb_owner -d neondb -p 5432
    ```

3.  **When prompted for the password, enter:** `npg_VgSmhw0IA9bF`

4.  **Once connected, you will see a `neondb=>` or similar prompt.** Now, you can execute the SQL statements I provided earlier. Copy and paste the following into the `psql` prompt:

    ```sql
    ALTER TABLE "quotes"
    ADD COLUMN "fraud_status" varchar(50) DEFAULT 'ok',
    ADD COLUMN "fraud_score" integer,
    ADD COLUMN "fraud_details" json,
    ADD COLUMN "fraud_checked_at" timestamp,
    ADD COLUMN "fraud_note" text;
    ```
    Make sure to include the semicolon at the end of the last statement. Press Enter.

5.  **You should see a message like `ALTER TABLE` if the execution was successful.**

6.  **To verify the new columns, you can run:**

    ```sql
    \d quotes
    ```
    This will describe the `quotes` table, and you should see the new columns listed.

7.  **To exit `psql`, type:**

    ```sql
    \q
    ```
    and press Enter.

Please execute these steps and let me know the outcome.