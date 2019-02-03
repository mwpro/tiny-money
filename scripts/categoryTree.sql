-- Adminer 4.6.2 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';


INSERT INTO `category` (`id`, `name`) VALUES
(1,	'Jedzenie'),
(2,	'Mieszkanie / dom'),
(3,	'Transport'),
(4,	'Usługi'),
(5,	'Opieka zdrowotna'),
(6,	'Ubrania'),
(7,	'Higiena'),
(8,	'Elektronika'),
(10,	'Rozrywka'),
(11,	'Zwierzaki'),
(12,	'Podróże'),
(13,	'Inne');

INSERT INTO `hibernate_sequence` (`next_val`) VALUES
(55),
(55),
(55),
(55);

INSERT INTO `subcategory` (`id`, `name`, `parent_category_id`) VALUES
(14,	'Dom',	1),
(15,	'Miasto',	1),
(16,	'Praca',	1),
(17,	'Czynsz',	2),
(18,	'Woda',	2),
(19,	'Prąd',	2),
(20,	'Gaz',	2),
(21,	'Ogrzewanie',	2),
(22,	'Konserwacje i naprawy',	2),
(23,	'Wyposażenie',	2),
(24,	'Paliwo do auta',	3),
(25,	'Bilet komunikacji miejskiej',	3),
(26,	'Bilet PKP, PKS',	3),
(27,	'Taxi',	3),
(28,	'Telefon',	4),
(29,	'TV i Internet',	4),
(30,	'Szkoła',	4),
(31,	'Lekarz',	5),
(32,	'Badania',	5),
(33,	'Lekarstwa',	5),
(34,	'Dobroczynność',	13),
(35,	'Prezenty',	13),
(36,	'Edukacja / Szkolenia',	13),
(37,	'Inne',	13),
(38,	'Przeloty',	12),
(39,	'Hotele',	12),
(40,	'Inne',	12),
(41,	'Niczko',	11),
(42,	'Króliczki',	11),
(43,	'Siłownia / Basen',	10),
(44,	'Kino / Teatr',	10),
(45,	'Książki',	10),
(46,	'Inne',	10),
(47,	'Sprzęty',	8),
(48,	'Oprogramowanie',	8),
(49,	'Gry',	8),
(50,	'Abonamenty',	8),
(51,	'Kosmetyki',	7),
(52,	'Inne',	7),
(53,	'Ubrania',	6),
(54,	'Buty',	6);




-- 2019-02-03 02:04:58