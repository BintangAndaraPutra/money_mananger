#ifndef FILEMANAGER_H
#define FILEMANAGER_H

#include <string>
#include <vector>

struct Transaction {
    int id;
    std::string type;      // "pemasukan" or "pengeluaran"
    std::string category;
    double amount;
    std::string description;
    std::string date;
};

class FileManager {
private:
    std::string filename;
    
public:
    FileManager(const std::string& fname);
    
    bool initializeDataFile();
    bool saveTransaction(const Transaction& t);
    std::vector<Transaction> getAllTransactions();
    bool deleteTransaction(int id);
    std::string getCurrentDate();
};

#endif