const CATEGORIES = [
  ['Clothing','Accessories'],['Clothing','Clothes'],['Clothing','Shoes'],
  ['Entertainment','Arcade'],['Entertainment','Concerts'],['Entertainment','Events'],
  ['Entertainment','Movies'],['Entertainment','Streaming Service'],['Entertainment','Video Games'],
  ['Finance','Credit Card Fee'],
  ['Food','Bars'],['Food','Doordash'],['Food','Eat-out (Restaurant)'],['Food','Groceries'],['Food','Pick-up (Restaurant)'],
  ['Health Care','Dental'],['Health Care','Medication'],['Health Care','Primary Care'],['Health Care','Urgent Care'],['Health Care','Vision'],
  ['Miscellaneous','Class Action Lawsuit'],
  ['Personal Care','Hair Care'],
  ['Recreation','Cash'],['Recreation','Equipment'],['Recreation','Gym'],
  ['Rent','Moving'],['Rent','Parking'],['Rent','Rent'],["Rent","Renter's Insurance"],['Rent','Security Deposit'],
  ['Retirement','401k'],['Retirement','Roth IRA'],
  ['Shopping','Board Games'],['Shopping','Clothes'],['Shopping','Equipment'],['Shopping','General Shopping'],['Shopping','Gifts'],['Shopping','Hair Care'],['Shopping','Home'],
  ['Taxes','Federal Tax'],['Taxes','State Tax'],
  ['Tech','Apple Care'],['Tech','Home'],['Tech','Software'],['Tech','Storage'],
  ['Transportation','Air'],['Transportation','Bike/Scooter'],['Transportation','Car Insurance'],['Transportation','Car Maintenance'],['Transportation','Car Registration'],['Transportation','Gas'],['Transportation','Oil Change'],['Transportation','Parking'],['Transportation','Public Transportation'],['Transportation','Rideshare'],['Transportation','Ticket'],['Transportation','Tolls'],
  ['Utilities','Electric/Gas'],['Utilities','Internet'],
  ["Vacation","Japan '23"],["Vacation","Japan '24"],["Vacation","LA '24"],["Vacation","Mexico '25"],["Vacation","Minneapoolis '24"],["Vacation","Minnesota '23"],["Vacation","OC '25"],["Vacation","SF '23"],["Vacation","SF '24"],["Vacation","SF '25"],["Vacation","Tahoe '25"],["Vacation","Whistler '24"],
];

module.exports = function seed(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (count > 0) return;
  const insert = db.prepare('INSERT OR IGNORE INTO categories (category, sub_category) VALUES (?, ?)');
  db.transaction(() => CATEGORIES.forEach(([c, s]) => insert.run(c, s)))();
};
