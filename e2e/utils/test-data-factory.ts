import { faker } from '@faker-js/faker';

export const testDataFactory = {
  user: () => ({
    // Faker v10 removed the format-string overload for phone.number(). Keep a stable E.164-ish test value.
    phone: `+1${faker.string.numeric(10)}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    location: faker.location.city(),
  }),

  service: () => ({
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    category: faker.helpers.arrayElement(['Cleaning', 'Plumbing', 'Electrical', 'Moving']),
    price: faker.number.int({ min: 50, max: 500 }),
    location: faker.location.city(),
  }),

  supply: () => ({
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    category: faker.helpers.arrayElement(['Tools', 'Materials', 'Equipment']),
    price: faker.number.int({ min: 10, max: 1000 }),
    stock: faker.number.int({ min: 1, max: 100 }),
  }),

  course: () => ({
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraphs(3),
    category: faker.helpers.arrayElement(['Business', 'Technical', 'Creative']),
    price: faker.number.int({ min: 0, max: 500 }),
    duration: faker.number.int({ min: 1, max: 12 }),
  }),

  job: () => ({
    title: faker.person.jobTitle(),
    description: faker.lorem.paragraphs(5),
    category: faker.helpers.arrayElement(['Full-time', 'Part-time', 'Contract']),
    location: faker.location.city(),
    salary: faker.number.int({ min: 30000, max: 150000 }),
  }),
};