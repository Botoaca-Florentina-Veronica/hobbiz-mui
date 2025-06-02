using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using MongoDB.Bson;
using MongoDB.Driver;

public class MitmAlert
{
    public ObjectId Id { get; set; }
    public string Type { get; set; }
    public string Message { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class MitmDetector
{
    private readonly IMongoCollection<MitmAlert> _alerts;

    public MitmDetector(string mongoConnectionString, string dbName)
    {
        var client = new MongoClient(mongoConnectionString);
        var db = client.GetDatabase(dbName);
        _alerts = db.GetCollection<MitmAlert>("alerts");
    }

    public void RunDetection()
    {
        DetectArpSpoofing();
        DetectDuplicateIp();
        // DetectDnsSpoofing(); // Exemplu: vezi mai jos
    }

    private void DetectArpSpoofing()
    {
        var arpTable = GetArpTable();
        var macGroups = arpTable.GroupBy(e => e.IpAddress)
                                .Where(g => g.Select(x => x.MacAddress).Distinct().Count() > 1);

        foreach (var group in macGroups)
        {
            var msg = $"ARP anomaly: IP {group.Key} has multiple MACs: {string.Join(", ", group.Select(x => x.MacAddress))}";
            SaveAlert("ARP Spoofing", msg);
            Console.WriteLine(msg);
        }
    }

    private void DetectDuplicateIp()
    {
        var arpTable = GetArpTable();
        var ipGroups = arpTable.GroupBy(e => e.MacAddress)
                               .Where(g => g.Select(x => x.IpAddress).Distinct().Count() > 1);

        foreach (var group in ipGroups)
        {
            var msg = $"Duplicate IP: MAC {group.Key} has multiple IPs: {string.Join(", ", group.Select(x => x.IpAddress))}";
            SaveAlert("Duplicate IP", msg);
            Console.WriteLine(msg);
        }
    }

    private void SaveAlert(string type, string message)
    {
        var alert = new MitmAlert { Type = type, Message = message };
        _alerts.InsertOne(alert);
    }

    private List<(string IpAddress, string MacAddress)> GetArpTable()
    {
        var result = new List<(string, string)>();
        var psi = new ProcessStartInfo("arp", "-a")
        {
            RedirectStandardOutput = true,
            UseShellExecute = false
        };
        using var proc = Process.Start(psi);
        string output = proc.StandardOutput.ReadToEnd();
        proc.WaitForExit();

        foreach (var line in output.Split('\n'))
        {
            var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 3 && parts[1].Contains("-"))
            {
                result.Add((parts[0], parts[1]));
            }
        }
        return result;
    }
}

class Program
{
    static void Main()
    {
        // Exemplu de conexiune MongoDB (modifică după caz)
        string mongoConn = "mongodb://localhost:27017";
        string dbName = "hobbiz";
        var detector = new MitmDetector(mongoConn, dbName);

        detector.RunDetection();

        Console.WriteLine("Detecție MITM finalizată.");
    }
}
