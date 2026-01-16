#include "filemanager.h"
#include <iostream>
#include <sstream>
#include <thread>
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

using namespace std;

class SimpleServer {
private:
    SOCKET serverSocket;
    int port;
    FileManager& fileManager;
    
    void sendResponse(SOCKET client, const string& content, const string& contentType = "application/json") {
        string response = 
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: " + contentType + "\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\r\n"
            "Access-Control-Allow-Headers: Content-Type\r\n"
            "Content-Length: " + to_string(content.length()) + "\r\n"
            "Connection: close\r\n\r\n" + content;
        send(client, response.c_str(), response.length(), 0);
    }
    
    void handleClient(SOCKET client) {
        char buffer[4096];
        int bytes = recv(client, buffer, sizeof(buffer)-1, 0);
        
        if (bytes > 0) {
            buffer[bytes] = '\0';
            string request(buffer);
            
            // Handle OPTIONS (CORS preflight)
            if (request.find("OPTIONS") != string::npos) {
                string response = 
                    "HTTP/1.1 200 OK\r\n"
                    "Access-Control-Allow-Origin: *\r\n"
                    "Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\r\n"
                    "Access-Control-Allow-Headers: Content-Type\r\n"
                    "Content-Length: 0\r\n"
                    "Connection: close\r\n\r\n";
                send(client, response.c_str(), response.length(), 0);
                closesocket(client);
                return;
            }
            
            // GET /api/health
            if (request.find("GET /api/health") != string::npos) {
                string json = "{\"status\":\"ok\",\"service\":\"Money Manager\",\"version\":\"1.0\",\"timestamp\":" + 
                              to_string(time(nullptr)) + "}";
                sendResponse(client, json);
            }
            // GET /api/transactions
            else if (request.find("GET /api/transactions") != string::npos) {
                auto transactions = fileManager.getAllTransactions();
                stringstream json;
                json << "[";
                for (size_t i = 0; i < transactions.size(); i++) {
                    const auto& t = transactions[i];
                    json << "{"
                         << "\"id\":" << t.id << ","
                         << "\"type\":\"" << t.type << "\","
                         << "\"category\":\"" << t.category << "\","
                         << "\"amount\":" << t.amount << ","
                         << "\"description\":\"" << t.description << "\","
                         << "\"date\":\"" << t.date << "\""
                         << "}";
                    if (i < transactions.size() - 1) json << ",";
                }
                json << "]";
                sendResponse(client, json.str());
            }
            // POST /api/transactions
            else if (request.find("POST /api/transactions") != string::npos) {
                // Simple JSON parsing
                size_t bodyPos = request.find("\r\n\r\n");
                if (bodyPos != string::npos) {
                    string body = request.substr(bodyPos + 4);
                    
                    // Parse JSON (simplified)
                    string type = "pemasukan";
                    string category = "General";
                    double amount = 0.0;
                    string description = "";
                    string date = fileManager.getCurrentDate();
                    
                    // Extract values (very simple parser)
                    if (body.find("\"type\"") != string::npos) {
                        size_t start = body.find("\"", body.find("\"type\"") + 6) + 1;
                        size_t end = body.find("\"", start);
                        type = body.substr(start, end - start);
                    }
                    
                    if (body.find("\"category\"") != string::npos) {
                        size_t start = body.find("\"", body.find("\"category\"") + 10) + 1;
                        size_t end = body.find("\"", start);
                        category = body.substr(start, end - start);
                    }
                    
                    if (body.find("\"amount\"") != string::npos) {
                        size_t start = body.find(":", body.find("\"amount\"")) + 1;
                        size_t end = body.find_first_of(",}", start);
                        string val = body.substr(start, end - start);
                        amount = stod(val);
                    }
                    
                    if (body.find("\"description\"") != string::npos) {
                        size_t start = body.find("\"", body.find("\"description\"") + 13) + 1;
                        size_t end = body.find("\"", start);
                        description = body.substr(start, end - start);
                    }
                    
                    if (body.find("\"date\"") != string::npos) {
                        size_t start = body.find("\"", body.find("\"date\"") + 6) + 1;
                        size_t end = body.find("\"", start);
                        date = body.substr(start, end - start);
                    }
                    
                    // Save transaction
                    Transaction t;
                    t.id = 0; // Auto-generated
                    t.type = type;
                    t.category = category;
                    t.amount = amount;
                    t.description = description;
                    t.date = date;
                    
                    if (fileManager.saveTransaction(t)) {
                        sendResponse(client, "{\"success\":true,\"message\":\"Transaction saved\"}");
                    } else {
                        sendResponse(client, "{\"success\":false,\"message\":\"Save failed\"}");
                    }
                } else {
                    sendResponse(client, "{\"success\":false,\"message\":\"No data\"}");
                }
            }
            // DELETE /api/transactions/{id}
            else if (request.find("DELETE /api/transactions/") != string::npos) {
                // Extract ID
                size_t start = request.find("/api/transactions/") + 18;
                size_t end = request.find(" ", start);
                string idStr = request.substr(start, end - start);
                
                try {
                    int id = stoi(idStr);
                    if (fileManager.deleteTransaction(id)) {
                        sendResponse(client, "{\"success\":true,\"message\":\"Deleted\"}");
                    } else {
                        sendResponse(client, "{\"success\":false,\"message\":\"Not found\"}");
                    }
                } catch (...) {
                    sendResponse(client, "{\"success\":false,\"message\":\"Invalid ID\"}");
                }
            }
            // Default
            else {
                sendResponse(client, "{\"message\":\"Money Manager API\"}");
            }
        }
        
        closesocket(client);
    }

public:
    SimpleServer(int p, FileManager& fm) : port(p), fileManager(fm), serverSocket(INVALID_SOCKET) {}
    
    bool start() {
        // Initialize Winsock
        WSADATA wsa;
        if (WSAStartup(MAKEWORD(2,2), &wsa) != 0) {
            cerr << "WSAStartup failed!" << endl;
            return false;
        }
        
        // Create socket
        serverSocket = socket(AF_INET, SOCK_STREAM, 0);
        if (serverSocket == INVALID_SOCKET) {
            cerr << "Socket failed!" << endl;
            return false;
        }
        
        // Bind to port (try multiple)
        int ports[] = {8888, 8080, 8081, 3000};
        bool bound = false;
        
        for (int p : ports) {
            port = p;
            sockaddr_in addr;
            addr.sin_family = AF_INET;
            addr.sin_addr.s_addr = INADDR_ANY;
            addr.sin_port = htons(port);
            
            if (bind(serverSocket, (sockaddr*)&addr, sizeof(addr)) == 0) {
                bound = true;
                break;
            }
        }
        
        if (!bound) {
            cerr << "Bind failed on all ports!" << endl;
            return false;
        }
        
        // Listen
        if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
            cerr << "Listen failed!" << endl;
            return false;
        }
        
        return true;
    }
    
    void run() {
        cout << "================================================" << endl;
        cout << "     MONEY MANAGER BACKEND - PORT " << port << endl;
        cout << "================================================" << endl;
        cout << "🌐 URL: http://localhost:" << port << endl;
        cout << "💾 Data: data.csv" << endl;
        cout << "📡 Waiting for connections..." << endl;
        cout << "================================================" << endl;
        
        while (true) {
            SOCKET client = accept(serverSocket, nullptr, nullptr);
            if (client != INVALID_SOCKET) {
                thread([this, client]() { handleClient(client); }).detach();
            }
        }
    }
};

int main() {
    FileManager fm("data.csv");
    if (!fm.initializeDataFile()) {
        cerr << "Failed to initialize data file!" << endl;
        return 1;
    }
    
    SimpleServer server(8888, fm);
    if (!server.start()) {
        cerr << "Failed to start server!" << endl;
        return 1;
    }
    
    server.run();
    return 0;
}