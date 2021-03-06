create database tinymoney COLLATE 'utf8_general_ci'; -- Create the new database
create user 'tinymoney-api'@'%' identified by 'tinymoney-api-dev'; -- Creates the user
grant all on tinymoney.* to 'tinymoney-api'@'%'; -- Gives all the privileges to the new user on the newly created database

-- Adminer 4.6.2 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

INSERT INTO `category` (`id`, `name`) VALUES
(1,	'Spożywcze'),
(5,	'Rachunki'),
(11,	'Przychody');

INSERT INTO `hibernate_sequence` (`next_val`) VALUES
(17),
(17),
(17);

INSERT INTO `subcategory` (`id`, `name`, `parent_category_id`) VALUES
(2,	'Jedzenie do domu',	1),
(3,	'Jedzenie na mieście',	1),
(4,	'Jedzenie w pracy',	1),
(6,	'Prąd',	5),
(7,	'Gaz',	5),
(8,	'Czynsz',	5),
(9,	'Internet',	5),
(10,	'Telefon',	5),
(12,	'Pensja',	11),
(13,	'Sprzedaż na allegro',	11);

INSERT INTO `transaction` (`id`, `amount`, `created_date`, `is_expense`, `modified_date`, `transaction_date`, `subcategory_id`) VALUES
(14,	15000.00,	'2019-01-20 10:03:08',	CONV('0', 2, 10) + 0,	'2019-01-20 10:03:08',	'2018-12-29',	12),
(15,	400.00,	'2019-01-20 10:03:33',	CONV('1', 2, 10) + 0,	'2019-01-20 10:03:33',	'2019-01-02',	8),
(16,	123.32,	'2019-01-20 10:03:41',	CONV('1', 2, 10) + 0,	'2019-01-20 10:03:41',	'2019-01-19',	6);

-- 2019-01-20 10:04:13