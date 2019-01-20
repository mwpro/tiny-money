create database tinymoney COLLATE 'utf8_general_ci'; -- Create the new database
create user 'tinymoney-api'@'%' identified by 'tinymoney-api-dev'; -- Creates the user
grant all on tinymoney.* to 'tinymoney-api'@'%'; -- Gives all the privileges to the new user on the newly created database