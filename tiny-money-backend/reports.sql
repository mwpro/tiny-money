-- sum of transactions by tags
SELECT t2.name, SUM(t.amount) FROM transaction t JOIN transaction_tag tt on t.id = tt.transaction_id JOIN tag t2 on tt.tag_id = t2.id
  GROUP BY tt.tag_id, t2.name;

-- transactions for given tags
SELECT * FROM transaction t JOIN transaction_tag tt on t.id = tt.transaction_id JOIN tag t2 on tt.tag_id = t2.id WHERE tag_id IN (1, 4);

-- sum of transactions by vendor
SELECT t.vendor_id, v.name, SUM(t.amount) AS sum FROM vendor v JOIN transaction t on v.id = t.vendor_id GROUP BY t.vendor_id, v.name ORDER BY sum DESC;

-- sum of transactions
SELECT SUM(t.amount) FROM transaction t;

-- sum of transactions by month
SELECT MONTH(transaction_date), SUM(amount) FROM transaction GROUP BY MONTH(transaction_date)

-- average sum of monthly transactions
SELECT AVG(x.s) FROM (SELECT SUM(amount) AS s FROM transaction GROUP BY MONTH(transaction_date)) x

-- sum of transactions by category
SELECT cat.name, scat.name, SUM(t.amount)
FROM transaction t
       JOIN subcategory scat on t.subcategory_id = scat.id
       JOIN category cat on cat.id = scat.parent_category_id
GROUP BY scat.id, cat.id, scat.name, cat.name
ORDER BY SUM(t.amount) DESC;