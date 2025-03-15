import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { addDocument, getDocument, updateDocument, deleteDocument, listDocuments, list_collections, updateArrayField, querySubcollection, addCadenceToZone } from './lib/firebase/firestoreClient';
import { db } from './lib/firebase/firebaseConfig';
import { listDirectoryFiles, getFileInfo } from './lib/firebase/storageClient';
import { getUserByIdOrEmail } from './lib/firebase/authClient';

class FirebaseMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'firebase-mcp-server',
        version: '0.9.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'firestore_add_document',
          description: 'Add a document to a Firestore collection',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'Collection name'
              },
              data: {
                type: 'object',
                description: 'Document data'
              }
            },
            required: ['collection', 'data']
          }
        },
        {
          name: 'firestore_list_collections',
          description: 'List collections in Firestore. If documentPath is provided, returns subcollections under that document; otherwise returns root collections.',
          inputSchema: {
            type: 'object',
            properties: {
            documentPath: {
              type: 'string',
              description: 'Optional parent document path'
            },
            limit: {
              type: 'number',
              description: 'Number of collections to return',
              default: 20
            },
            pageToken: {
              type: 'string',
              description: 'Token for pagination to get the next page of results'
            }
            },
            required: []
          }
        },
        {
          name: 'firestore_list_documents',
          description: 'List documents from a Firestore collection with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'Collection name'
              },
              filters: {
                type: 'array',
                description: 'Array of filter conditions',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      description: 'Field name to filter'
                    },
                    operator: {
                      type: 'string',
                      description: 'Comparison operator'
                    },
                    value: {
                      type: ['string', 'number', 'boolean', 'object', 'array', 'null'],
                      description: 'Value to compare against (use ISO format for dates)'
                    }
                  },
                  required: ['field', 'operator', 'value']
                }
              },
            limit: {
              type: 'number',
              description: 'Number of documents to return',
              default: 20
            },
            pageToken: {
              type: 'string',
              description: 'Token for pagination to get the next page of results'
            }
            },
            required: ['collection']
          }
        },
        {
          name: 'firestore_get_document',
          description: 'Get a document from a Firestore collection',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'Collection name'
              },
              id: {
                type: 'string',
                description: 'Document ID'
              }
            },
            required: ['collection', 'id']
          }
        },
        {
          name: 'firestore_update_document',
          description: 'Update a document in a Firestore collection',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'Collection name'
              },
              id: {
                type: 'string',
                description: 'Document ID'
              },
              data: {
                type: 'object',
                description: 'Updated document data'
              }
            },
            required: ['collection', 'id', 'data']
          }
        },
        {
          name: 'firestore_delete_document',
          description: 'Delete a document from a Firestore collection',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'Collection name'
              },
              id: {
                type: 'string',
                description: 'Document ID'
              }
            },
            required: ['collection', 'id']
          }
        },
        {
          name: "auth_get_user",
          description: "Get a user by ID or email from Firebase Authentication",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "User ID or email address"
              }
            },
            required: ["identifier"]
          }
        },
        {
          "name": "storage_list_files",
          "description": "List files in a given path in Firebase Storage",
          "inputSchema": {
            "type": "object",
            "properties": {
              "directoryPath": {
                "type": "string",
                "description": "The optional path to list files from. If not provided, the root is used."
              }
            },
            "required": []
          }
        },
        {
          "name": "storage_get_file_info",
          "description": "Get file information including metadata and download URL",
          "inputSchema": {
            "type": "object",
            "properties": {
              "filePath": {
                "type": "string",
                "description": "The path of the file to get information for"
              }
            },
            "required": ["filePath"]
          }
        },
        {
          name: 'firestore_update_array_field',
          description: 'Update an array field in a document by adding or removing a value',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'Collection name'
              },
              id: {
                type: 'string',
                description: 'Document ID'
              },
              field: {
                type: 'string',
                description: 'Array field name to update'
              },
              value: {
                type: ['string', 'number', 'boolean', 'object'],
                description: 'Value to add to or remove from the array'
              },
              operation: {
                type: 'string',
                enum: ['add', 'remove'],
                description: 'Operation to perform: add (arrayUnion) or remove (arrayRemove)'
              }
            },
            required: ['collection', 'id', 'field', 'value', 'operation']
          }
        },
        {
          name: 'firestore_query_subcollection',
          description: 'Query a subcollection by first finding a parent document, then querying its subcollection',
          inputSchema: {
            type: 'object',
            properties: {
              parentCollection: {
                type: 'string',
                description: 'Parent collection name'
              },
              parentField: {
                type: 'string',
                description: 'Field in parent collection to match'
              },
              parentValue: {
                type: ['string', 'number', 'boolean'],
                description: 'Value to match in the parent field'
              },
              subcollectionName: {
                type: 'string',
                description: 'Name of the subcollection to query'
              },
              filters: {
                type: 'array',
                description: 'Optional array of filter conditions for the subcollection',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      description: 'Field name to filter'
                    },
                    operator: {
                      type: 'string',
                      description: 'Comparison operator'
                    },
                    value: {
                      type: ['string', 'number', 'boolean', 'object', 'array', 'null'],
                      description: 'Value to compare against'
                    }
                  },
                  required: ['field', 'operator', 'value']
                }
              },
              limit: {
                type: 'number',
                description: 'Number of documents to return',
                default: 20
              }
            },
            required: ['parentCollection', 'parentField', 'parentValue', 'subcollectionName']
          }
        },
        {
          name: 'firestore_add_cadence_to_zone',
          description: 'Add a cadence ID to a zone\'s cadenceIds array by finding the zone with a specific name',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID who owns the zone'
              },
              zoneName: {
                type: 'string',
                description: 'Name of the zone to find'
              },
              cadenceId: {
                type: 'string',
                description: 'Cadence ID to add to the zone'
              }
            },
            required: ['userId', 'zoneName', 'cadenceId']
          }
        }
        ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;
      switch (name) {
        case 'firestore_add_document':
          return addDocument(args.collection as string, args.data as object);
        case 'firestore_list_documents':
          return listDocuments(
            args.collection as string,
            args.filters as Array<{ field: string, operator: FirebaseFirestore.WhereFilterOp, value: any }>,
            args.limit as number,
            args.pageToken as string | undefined
          );
        case 'firestore_get_document':
          return getDocument(args.collection as string, args.id as string);
        case 'firestore_update_document':
          return updateDocument(args.collection as string, args.id as string, args.data as object);
        case 'firestore_delete_document':
          return deleteDocument(args.collection as string, args.id as string);
        case 'firestore_list_collections':
          return list_collections(
            args.documentPath as string | undefined,
            args.limit as number | undefined,
            args.pageToken as string | undefined
          );
        case 'auth_get_user':
          return getUserByIdOrEmail(args.identifier as string);
        case 'storage_list_files':
          return listDirectoryFiles(
            args.directoryPath as string | undefined,
            args.pageSize as number | undefined,
            args.pageToken as string | undefined
          );
        case 'storage_get_file_info':
          return getFileInfo(args.filePath as string);
        case 'firestore_update_array_field':
          return updateArrayField(
            args.collection as string, 
            args.id as string, 
            args.field as string, 
            args.value, 
            args.operation as 'add' | 'remove'
          );
        case 'firestore_query_subcollection':
          return querySubcollection(
            args.parentCollection as string,
            args.parentField as string,
            args.parentValue,
            args.subcollectionName as string,
            args.filters as Array<{ field: string, operator: FirebaseFirestore.WhereFilterOp, value: any }>,
            args.limit as number
          );
        case 'firestore_add_cadence_to_zone':
          return addCadenceToZone(
            args.userId as string,
            args.zoneName as string,
            args.cadenceId as string
          );
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Firebase MCP server running on stdio');
  }
}

const server = new FirebaseMcpServer();
server.run().catch(console.error);
