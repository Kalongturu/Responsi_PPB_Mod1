create table if not exists members (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text unique,
  phone      text,
  created_at timestamptz not null default now()
);

create table if not exists books (
  id         bigint generated always as identity primary key,
  title      text not null,
  author     text not null,
  isbn       text unique,
  created_at timestamptz not null default now()
);

create table if not exists loans (
  id          bigint generated always as identity primary key,
  member_id   bigint not null references members(id) on delete restrict,
  book_id     bigint not null references books(id)   on delete restrict,
  loan_date   date   not null default current_date,
  due_date    date   not null,
  return_date date,
  
  status      text   not null default 'Dipinjam'
              check (status in ('Dipinjam', 'Dikembalikan')),
  notes       text,
  created_at  timestamptz not null default now(),
  constraint loans_due_after_loan   check (due_date >= loan_date),
  constraint loans_return_after_loan check (return_date is null or return_date >= loan_date),
  constraint loans_status_vs_return  check ((status = 'Dikembalikan') = (return_date is not null))
);


create unique index if not exists loans_one_active_per_book
  on loans (book_id) where status = 'Dipinjam';

create index if not exists loans_status_due_idx on loans (status, due_date);
create index if not exists loans_member_idx on loans (member_id);


insert into members (name, email, phone) values
  ('Budi Santoso', 'budi@example.com', '081234567890'),
  ('Siti Aminah',  'siti@example.com', '081298765432');

insert into books (title, author, isbn) values
  ('Laskar Pelangi',      'Andrea Hirata',        '9789793062792'),
  ('Bumi Manusia',        'Pramoedya Ananta Toer','9789799731234'),
  ('Filosofi Teras',      'Henry Manampiring',    '9786024125189');

insert into loans (member_id, book_id, loan_date, due_date, status) values
  (1, 1, current_date - 20, current_date - 13, 'Dipinjam');          -- terlambat
insert into loans (member_id, book_id, loan_date, due_date, return_date, status) values
  (2, 2, current_date - 10, current_date - 3,  current_date - 4, 'Dikembalikan');
insert into loans (member_id, book_id, loan_date, due_date, status) values
  (2, 3, current_date - 1,  current_date + 6,  'Dipinjam');          -- masih berjalan
