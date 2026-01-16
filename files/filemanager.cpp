#include "filemanager.h"
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <ctime>

FileManager::FileManager(const std::string& fname) : filename(fname) {}

bool FileManager::initializeDataFile() {
    std::ifstream file(filename);
    if (!file.good()) {
        std::ofstream newFile(filename);
        if (newFile.is_open()) {
            newFile << "id,type,category,amount,description,date\n";
            newFile.close();
            std::cout << "Created data file: " << filename << std::endl;
            return true;
        }
        return false;
    }
    return true;
}

bool FileManager::saveTransaction(const Transaction& t) {
    std::ofstream file(filename, std::ios::app);
    if (!file.is_open()) return false;
    
    // Get next ID
    auto all = getAllTransactions();
    int nextId = 1;
    for (const auto& trans : all) {
        if (trans.id >= nextId) nextId = trans.id + 1;
    }
    
    Transaction toSave = t;
    toSave.id = nextId;
    
    file << toSave.id << ","
         << toSave.type << ","
         << toSave.category << ","
         << toSave.amount << ","
         << toSave.description << ","
         << toSave.date << "\n";
    
    file.close();
    return true;
}

std::vector<Transaction> FileManager::getAllTransactions() {
    std::vector<Transaction> result;
    std::ifstream file(filename);
    
    if (!file.is_open()) return result;
    
    std::string line;
    std::getline(file, line); // Skip header
    
    while (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string token;
        Transaction t;
        
        if (std::getline(ss, token, ',')) t.id = std::stoi(token);
        if (std::getline(ss, token, ',')) t.type = token;
        if (std::getline(ss, token, ',')) t.category = token;
        if (std::getline(ss, token, ',')) t.amount = std::stod(token);
        if (std::getline(ss, token, ',')) t.description = token;
        if (std::getline(ss, token, ',')) t.date = token;
        
        result.push_back(t);
    }
    
    // Sort by date (newest first)
    std::sort(result.begin(), result.end(), 
              [](const Transaction& a, const Transaction& b) {
                  return a.date > b.date;
              });
    
    return result;
}

bool FileManager::deleteTransaction(int id) {
    auto all = getAllTransactions();
    std::ofstream file(filename);
    
    if (!file.is_open()) return false;
    
    file << "id,type,category,amount,description,date\n";
    bool found = false;
    
    for (const auto& t : all) {
        if (t.id != id) {
            file << t.id << ","
                 << t.type << ","
                 << t.category << ","
                 << t.amount << ","
                 << t.description << ","
                 << t.date << "\n";
        } else {
            found = true;
        }
    }
    
    file.close();
    return found;
}

std::string FileManager::getCurrentDate() {
    time_t now = time(0);
    tm* local = localtime(&now);
    
    char buffer[20];
    strftime(buffer, sizeof(buffer), "%Y-%m-%d", local);
    return std::string(buffer);
}