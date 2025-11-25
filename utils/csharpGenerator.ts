export interface GeneratorConfig {
  qdrantUrl: string;
  collectionName: string;
  embeddingModel: string;
  distanceMetric: 'Cosine' | 'Euclid' | 'Dot';
  chunkSize: number;
}

export const generateUnityScript = (config: GeneratorConfig): string => {
  return `using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEditor;
using UnityEngine.Networking;
using System.Reflection;
using System.Linq;

// DEPENDENCIES:
// Ensure you have "com.unity.nuget.newtonsoft-json" installed via Package Manager
// or any standard JSON library. This script uses simple string manipulation for
// minimal dependencies, but Newtonsoft is recommended for the payload.

namespace UnityQdrantIndexer
{
    public class QdrantIndexerWindow : EditorWindow
    {
        private string qdrantUrl = "${config.qdrantUrl}";
        private string collectionName = "${config.collectionName}";
        private string geminiApiKey = ""; // Set your API Key here or in the UI
        private const string GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/${config.embeddingModel}:embedContent";
        
        private bool isIndexing = false;
        private string statusMessage = "Ready";
        private float progress = 0f;

        [MenuItem("Tools/AI/Qdrant Indexer")]
        public static void ShowWindow()
        {
            GetWindow<QdrantIndexerWindow>("Qdrant Indexer");
        }

        private void OnGUI()
        {
            GUILayout.Label("Qdrant Knowledge Graph Indexer", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            qdrantUrl = EditorGUILayout.TextField("Qdrant URL", qdrantUrl);
            collectionName = EditorGUILayout.TextField("Collection Name", collectionName);
            geminiApiKey = EditorGUILayout.PasswordField("Gemini API Key", geminiApiKey);

            EditorGUILayout.Space();
            GUILayout.Label($"Status: {statusMessage}", EditorStyles.helpBox);
            EditorGUI.ProgressBar(GUILayoutUtility.GetRect(18, 18), progress, "Indexing Progress");
            EditorGUILayout.Space();

            if (isIndexing)
            {
                if (GUILayout.Button("Cancel"))
                {
                    isIndexing = false;
                    statusMessage = "Cancelled";
                }
            }
            else
            {
                if (GUILayout.Button("Create Collection & Index Project"))
                {
                    if (string.IsNullOrEmpty(geminiApiKey))
                    {
                        EditorUtility.DisplayDialog("Error", "Please enter a Gemini API Key.", "OK");
                        return;
                    }
                    IndexProject();
                }
            }
        }

        private async void IndexProject()
        {
            isIndexing = true;
            progress = 0f;
            statusMessage = "Starting...";

            try 
            {
                // 1. Create Collection
                statusMessage = "Ensuring Qdrant Collection exists...";
                await EnsureCollectionExists();
                
                // 2. Scan Project
                statusMessage = "Scanning Code & Documentation...";
                var allSymbols = new List<IndexItem>();
                allSymbols.AddRange(ScanCodebase());
                allSymbols.AddRange(ScanDocumentation());
                
                // 3. Process & Embed
                int total = allSymbols.Count;
                for(int i=0; i<total; i++)
                {
                    if (!isIndexing) break;

                    var symbol = allSymbols[i];
                    statusMessage = $"Processing {symbol.Name} ({symbol.Type})...";
                    
                    // Generate Embedding via Gemini
                    float[] vector = await GetEmbedding(symbol.Content);
                    
                    if (vector != null)
                    {
                        // Upsert to Qdrant
                        await UpsertPoint(symbol, vector);
                    }

                    progress = (float)i / total;
                    await Task.Delay(50); // Prevent editor freeze
                    Repaint();
                }

                statusMessage = "Indexing Complete!";
            }
            catch (Exception e)
            {
                Debug.LogError(e);
                statusMessage = $"Error: {e.Message}";
            }
            finally
            {
                isIndexing = false;
                progress = 1f;
            }
        }

        // --- Qdrant Logic ---

        private async Task EnsureCollectionExists()
        {
            // Check existence logic would go here. For brevity, we attempt creation.
            // In a real tool, check if collection exists first.
            var json = "{ \\"vectors\\": { \\"size\\": 768, \\"distance\\": \\"${config.distanceMetric}\\" } }";
            await SendRequest($"{qdrantUrl}/collections/{collectionName}", "PUT", json);
        }

        private async Task UpsertPoint(IndexItem symbol, float[] vector)
        {
            // Construct Qdrant Point JSON
            // Note: This manual JSON construction is fragile. Use Newtonsoft.Json in production.
            string vectorStr = "[" + string.Join(",", vector) + "]";
            
            // Clean content for JSON string
            string cleanContent = symbol.Content.Replace("\\"", "\\\\'").Replace("\\n", "\\\\n"); 
            string cleanRefs = string.Join(",", symbol.References);

            string payload = $@"
            {{
                ""points"": [
                    {{
                        ""id"": {Math.Abs(symbol.Name.GetHashCode())}, 
                        ""vector"": {vectorStr},
                        ""payload"": {{
                            ""name"": ""{symbol.Name}"",
                            ""type"": ""{symbol.Type}"",
                            ""content"": ""{cleanContent}"",
                            ""references"": ""{cleanRefs}""
                        }}
                    }}
                ]
            }}";

            await SendRequest($"{qdrantUrl}/collections/{collectionName}/points?wait=true", "PUT", payload);
        }

        // --- Gemini Logic ---

        private async Task<float[]> GetEmbedding(string text)
        {
            // Truncate to avoid token limits (rudimentary)
            if (text.Length > 8000) text = text.Substring(0, 8000);

            string jsonBody = $@"{{
                ""model"": ""models/${config.embeddingModel}"",
                ""content"": {{
                    ""parts"": [{{ ""text"": ""{text.Replace("\\"", "\\\\'").Replace("\\n", " ")}"" }}]
                }}
            }}";

            string url = $"{GEMINI_EMBED_URL}?key={geminiApiKey}";
            
            using (UnityWebRequest www = UnityWebRequest.Post(url, jsonBody, "application/json"))
            {
                // UnityWebRequest.Post doesn't handle JSON body well automatically in older versions
                // So we do a generic PUT/POST setup
                www.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonBody));
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");
                
                var operation = www.SendWebRequest();
                while (!operation.isDone) await Task.Delay(10);

                if (www.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"Gemini Error: {www.error} : {www.downloadHandler.text}");
                    return null;
                }

                // Parse Response (Quick & Dirty extraction for demo)
                // Use a real JSON parser for production
                string responseText = www.downloadHandler.text;
                return ParseEmbeddingFromResponse(responseText);
            }
        }

        private float[] ParseEmbeddingFromResponse(string json)
        {
            try {
                // Heuristic parsing to avoid external dependencies in this snippet
                int start = json.IndexOf("values");
                if (start == -1) return null;
                int arrayStart = json.IndexOf("[", start);
                int arrayEnd = json.IndexOf("]", arrayStart);
                string arrayContent = json.Substring(arrayStart + 1, arrayEnd - arrayStart - 1);
                
                return arrayContent.Split(',')
                    .Select(s => float.Parse(s.Trim()))
                    .ToArray();
            } catch {
                Debug.LogError("Failed to parse embedding JSON");
                return null;
            }
        }

        // --- Reflection / Analysis Logic ---

        private struct IndexItem
        {
            public string Name;
            public string Type;
            public string Content;
            public List<string> References;
        }

        private List<IndexItem> ScanCodebase()
        {
            var symbols = new List<IndexItem>();
            
            // Get all user scripts
            var assembly = Assembly.Load("Assembly-CSharp");
            if (assembly == null) return symbols;

            foreach (Type type in assembly.GetTypes())
            {
                if (type.Namespace != null && type.Namespace.StartsWith("Unity")) continue; // Skip internal Unity

                StringBuilder contentBuilder = new StringBuilder();
                contentBuilder.AppendLine($"Class: {type.Name}");
                
                var methods = type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
                var props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);

                List<string> refs = new List<string>();

                foreach(var p in props)
                {
                    contentBuilder.AppendLine($"Property: {p.PropertyType.Name} {p.Name}");
                    refs.Add(p.PropertyType.Name);
                }

                foreach(var m in methods)
                {
                    contentBuilder.AppendLine($"Method: {m.ReturnType.Name} {m.Name}");
                    // Rough logic: capture parameter types as references
                    foreach(var param in m.GetParameters())
                    {
                        refs.Add(param.ParameterType.Name);
                    }
                }

                symbols.Add(new IndexItem
                {
                    Name = type.Name,
                    Type = "Class",
                    Content = contentBuilder.ToString(),
                    References = refs.Distinct().ToList()
                });
            }

            return symbols;
        }

        private List<IndexItem> ScanDocumentation()
        {
            var symbols = new List<IndexItem>();
            // Find all TextAssets (includes .txt, .md, .json, etc.)
            string[] guids = AssetDatabase.FindAssets("t:TextAsset");

            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                
                // Filter for markdown and text files
                // Exclude Packages to avoid indexing internal Unity documentation
                if (path.StartsWith("Packages/")) continue;
                if (!path.EndsWith(".md", StringComparison.OrdinalIgnoreCase) && 
                    !path.EndsWith(".txt", StringComparison.OrdinalIgnoreCase)) 
                    continue;
                
                TextAsset asset = AssetDatabase.LoadAssetAtPath<TextAsset>(path);
                if (asset == null) continue;

                symbols.Add(new IndexItem
                {
                    Name = path, // Use path for uniqueness in docs
                    Type = "Documentation",
                    Content = asset.text,
                    References = new List<string>() // References could be parsed via Regex if needed
                });
            }

            return symbols;
        }

        // --- HTTP Helper ---

        private async Task SendRequest(string url, string method, string body = null)
        {
            using (UnityWebRequest www = new UnityWebRequest(url, method))
            {
                if (body != null)
                {
                    byte[] bodyRaw = Encoding.UTF8.GetBytes(body);
                    www.uploadHandler = new UploadHandlerRaw(bodyRaw);
                }
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");

                var op = www.SendWebRequest();
                while (!op.isDone) await Task.Delay(10);

                if (www.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogWarning($"Request to {url} failed: {www.error}\\n{www.downloadHandler.text}");
                }
            }
        }
    }
}
`;
};
