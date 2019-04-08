-- sum of transactions by tags
SELECT t2.name, SUM(t.amount) FROM transaction t JOIN transaction_tag tt on t.id = tt.transaction_id JOIN tag t2 on tt.tag_id = t2.id
  GROUP BY tt.tag_id, t2.name;

-- transactions for given tags
SELECT * FROM transaction t JOIN transaction_tag tt on t.id = tt.transaction_id JOIN tag t2 on tt.tag_id = t2.id WHERE tag_id IN (1, 4);

-- sum of transactions by vendor
SELECT t.vendor_id, v.name, SUM(t.amount) AS sum FROM vendor v JOIN transaction t on v.id = t.vendor_id GROUP BY t.vendor_id, v.name ORDER BY sum DESC;

-- sum of transactions
SELECT SUM(t.amount) FROM transaction t;