# Money Tracker Application

### Instructions for running the code

Pre-requisite: Docker Installed

```
git clone https://github.com/savss624/Cohesive---Money-Tracker-Assignment.git
cd Cohesive---Money-Tracker-Assignment/
docker-compose build
docker-compose up
```

Know Error: sh: webpack: not found
if the above error pop up then run
```
docker-compose run --rm front-end sh -c "yarn install"
```
trying to figure out why dockerfile not creating node_modules.

### Major Features Implemented

- User creation & authenication
- Group creation, deletion & updation
- Displays group name, budget & amount spent
- Transaction creation, deletion & updation
- Displays transaction date, category, amount and payed by
- While creating a transaction, a member can/cannot be someone that is registered in DB
- ^ feature is only available while creating transaction
- Settlement creation & deletion

### DB schema

User / Member Table:

- email
- name
- is_active
- is_staff

Non Member Table

- name
- is_active

Group Table

- title
- budget
- amt_spent

Group Balances Table

- member_id
- non_member_id
- group_id
- owes
- gets

Transaction Table

- category
- date
- group_id
- added_by
- amt
- payed_by
- owes_by

Settle

- date
- group_id
- added_by
- pays
- gets
- amt

### Tech stack

- Docker
- Django
- PostgreSQL
- Flake8
- Webpack
- ReactJS
- TailwindCSS
- ESLint
- Yarn
- Git
