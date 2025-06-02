using System;

string mongoConn = "mongodb://localhost:27017";
string dbName = "hobbiz";
var detector = new MitmDetector(mongoConn, dbName);
detector.RunDetection();
Console.WriteLine("Detecție MITM finalizată.");
