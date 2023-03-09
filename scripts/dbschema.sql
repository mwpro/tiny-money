create table bufferedTransaction
(
    id                          int auto_increment
        primary key,
    amount                      decimal(10, 2) not null,
    importDate                  datetime       not null,
    transactionDate             date           not null,
    rawBankStatementDescription varchar(255)   not null
)
    collate = utf8_polish_ci;

create table category
(
    id   int auto_increment
        primary key,
    name varchar(255) not null
)
    charset = latin2;

create table subcategory
(
    id                 int auto_increment
        primary key,
    name               varchar(255) not null,
    parent_category_id int          not null,
    constraint FK4okdhhvwkuyq53wuta7dxqrej
        foreign key (parent_category_id) references category (id)
)
    charset = latin2;

create table budget
(
    month          int            not null,
    year           int            not null,
    amount         decimal(19, 2) not null,
    created_date   datetime       not null,
    modified_date  datetime       null,
    subcategory_id int            not null,
    notes          longtext       null,
    primary key (month, subcategory_id, year),
    constraint FK1mdblf9aysk4sawqhi9krtfwd
        foreign key (subcategory_id) references subcategory (id)
)
    charset = latin2;

create table tag
(
    id   int auto_increment
        primary key,
    name varchar(255) not null
)
    charset = latin2;

create table vendor
(
    id                     int auto_increment
        primary key,
    name                   varchar(255) not null,
    default_subcategory_id int          not null,
    constraint FKae5dj4ttu92wn1om6envbnn76
        foreign key (default_subcategory_id) references subcategory (id)
)
    charset = latin2;

create table transaction
(
    id               int auto_increment
        primary key,
    amount           decimal(19, 2) not null,
    created_by       varchar(255)   not null,
    created_date     datetime       not null,
    description      longtext       null,
    is_expense       bit            not null,
    modified_date    datetime       null,
    transaction_date date           not null,
    subcategory_id   int            not null,
    vendor_id        int            not null,
    constraint FK5cpv0vgf70pxdtuna3mh69qw1
        foreign key (vendor_id) references vendor (id),
    constraint FKp7w3w7p3no2jxxxgljm500jw9
        foreign key (subcategory_id) references subcategory (id)
)
    charset = latin2;

create table transaction_tag
(
    tag_id         int not null,
    transaction_id int not null,
    primary key (tag_id, transaction_id),
    constraint FK7d8lvqkvukcf4gvfmtg4wfig6
        foreign key (transaction_id) references transaction (id),
    constraint FKl823jm48pl3r8n5or978p4sup
        foreign key (tag_id) references tag (id)
)
    charset = latin2;

