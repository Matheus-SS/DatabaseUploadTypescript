import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, getCustomRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CsvDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(csvFilePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(csvFilePath);

    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions: CsvDTO[] = [];
    const categories: string[] = [];

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    parseCSV.on('error', async err => {
      console.log(err.message);
      await fs.promises.unlink(csvFilePath);
    });

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((word: string) => word);

      transactions.push({ title, type, value, category });
      categories.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoriesTitleNotRepeated = Array.from(new Set(categories));

    const existingCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existingCategoriesTitle = existingCategories.map(
      existingCategory => existingCategory.title,
    );

    const categoriesNotAdded = categoriesTitleNotRepeated.filter(valor => {
      let categoryNotAdd;
      if (existingCategoriesTitle.indexOf(valor) === -1) {
        categoryNotAdd = valor;
      }
      return categoryNotAdd;
    });

    const newCategories = categoryRepository.create(
      categoriesNotAdded.map(categoryTitle => ({
        title: categoryTitle,
      })),
    );

    await categoryRepository.save(newCategories);

    const allCategoriesInTransaction = [
      ...existingCategories,
      ...newCategories,
    ];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: allCategoriesInTransaction.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(csvFilePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
