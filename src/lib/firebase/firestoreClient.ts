import { Query, Timestamp, FieldValue } from 'firebase-admin/firestore';
import {db, getProjectId} from './firebaseConfig';
import fs from 'fs';
import path from 'path';

export async function list_collections(documentPath?: string, limit: number = 20, pageToken?: string) {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    let collections;
    if (documentPath) {
      const docRef = db.doc(documentPath);
      collections = await docRef.listCollections();
    } else {
      collections = await db.listCollections();
    }
    
    // Sort collections by name
    collections.sort((a, b) => a.id.localeCompare(b.id));
    
    // Find start index
    const startIndex = pageToken ? collections.findIndex(c => c.id === pageToken) + 1 : 0;
    
    // Apply limit
    const paginatedCollections = collections.slice(startIndex, startIndex + limit);
    
    const projectId = getProjectId();
    const collectionData = paginatedCollections.map((collection) => {
      const collectionUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/${documentPath}/${collection.id}`;
      return { name: collection.id, url: collectionUrl };
    });
    
    return { 
      content: [{
        type: 'text', 
        text: JSON.stringify({
          collections: collectionData,
          nextPageToken: collections.length > startIndex + limit ? 
            paginatedCollections[paginatedCollections.length - 1].id : null,
          hasMore: collections.length > startIndex + limit
        })
      }]
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error listing collections: ${(error as Error).message}` }], isError: true };
  }
}

function convertTimestampsToISO(data: any) {
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return data;
}


export async function listDocuments(collection: string, filters: Array<{ field: string, operator: FirebaseFirestore.WhereFilterOp, value: any }> = [], limit: number = 20, pageToken?: string) {
  const projectId = getProjectId();
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    const collectionRef = db.collection(collection);
    let filteredQuery: Query = collectionRef;
    for (const filter of filters) {
      let filterValue = filter.value;
      if (typeof filterValue === 'string' && !isNaN(Date.parse(filterValue))) {
        filterValue = Timestamp.fromDate(new Date(filterValue));
      }
      filteredQuery = filteredQuery.where(filter.field, filter.operator, filterValue);
    }
    
    // Apply pageToken if provided
    if (pageToken) {
      const startAfterDoc = await collectionRef.doc(pageToken).get();
      filteredQuery = filteredQuery.startAfter(startAfterDoc);
    }

    // Get total count of documents matching the filter
    const countSnapshot = await filteredQuery.get();
    const totalCount = countSnapshot.size;

    // Get the first 'limit' documents
    const limitedQuery = filteredQuery.limit(limit);
    const snapshot = await limitedQuery.get();

    if (snapshot.empty) {
      return { content: [{ type: 'text', text: 'No matching documents found' }], isError: true };
    }
    
    const documents = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      convertTimestampsToISO(data);
      const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/${collection}/${doc.id}`;
      return { id: doc.id, url: consoleUrl, document: data };
    });
    
    return { 
      content: [{
        type: 'text', 
        text: JSON.stringify({
          totalCount,
          documents,
          pageToken: documents.length > 0 ? documents[documents.length - 1].id : null,
          hasMore: totalCount > limit
        })
      }]
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error listing documents: ${(error as Error).message}` }], isError: true };
  }
}

export async function addDocument(collection: string, data: any, id?: string) {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    // Check if data has createdAt field and replace it with server timestamp
    const dataToSave = { ...data };
    if ('createdAt' in dataToSave) {
      dataToSave.createdAt = FieldValue.serverTimestamp();
    }
    
    let docRef;
    
    if (id) {
      // Use custom ID with set() method
      docRef = db.collection(collection).doc(id);
      await docRef.set(dataToSave);
    } else {
      // Use auto-generated ID with add() method
      docRef = await db.collection(collection).add(dataToSave);
    }
    
    const projectId = getProjectId();
    convertTimestampsToISO(dataToSave);
    const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/${collection}/${docRef.id}`;
    return { content: [{ type: 'text', text: JSON.stringify({ id: docRef.id, url: consoleUrl, document: dataToSave }) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error adding document: ${(error as Error).message}` }], isError: true };
  }
}

export async function getDocument(collection: string, id: string) {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) {
      return { content: [{ type: 'text', text: 'Document not found' }], isError: true };
    }
    const projectId = getProjectId();
    const data = doc.data();
    convertTimestampsToISO(data);
    const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/${collection}/${id}`;
    return { content: [{ type: 'text', text: JSON.stringify({ id, url: consoleUrl, document: data }) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error getting document: ${(error as Error).message}` }], isError: true };
  }
}

export async function updateDocument(collection: string, id: string, data: any) {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    await db.collection(collection).doc(id).update(data);
    const projectId = getProjectId();
    convertTimestampsToISO(data);
    const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/${collection}/${id}`;
    return { content: [{ type: 'text', text: JSON.stringify({ id, url: consoleUrl, document: data }) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error updating document: ${(error as Error).message}` }], isError: true };
  }
}

export async function deleteDocument(collection: string, id: string) {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    await db.collection(collection).doc(id).delete();
    return { content: [{ type: 'text', text: 'Document deleted successfully' }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error deleting document: ${(error as Error).message}` }], isError: true };
  }
}

export async function updateArrayField(collection: string, id: string, field: string, value: any, operation: 'add' | 'remove') {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { content: [{ type: 'text', text: 'Document not found' }], isError: true };
    }
    
    // Create update object with array operation
    const updateData: any = {};
    if (operation === 'add') {
      updateData[field] = FieldValue.arrayUnion(value);
    } else {
      updateData[field] = FieldValue.arrayRemove(value);
    }
    
    await docRef.update(updateData);
    
    // Get the updated document
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();
    convertTimestampsToISO(data);
    
    const projectId = getProjectId();
    const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/${collection}/${id}`;
    
    return { 
      content: [{ 
        type: 'text', 
        text: JSON.stringify({ 
          id, 
          url: consoleUrl, 
          document: data,
          operation: `Array field '${field}' ${operation === 'add' ? 'updated with new value' : 'removed value'}`
        }) 
      }] 
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error updating array field: ${(error as Error).message}` }], isError: true };
  }
}

export async function querySubcollection(
  parentCollection: string, 
  parentField: string, 
  parentValue: any, 
  subcollectionName: string,
  filters: Array<{ field: string, operator: FirebaseFirestore.WhereFilterOp, value: any }> = [],
  limit: number = 20
) {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    // First, query the parent collection to find the parent document
    const parentQuery = await db.collection(parentCollection)
      .where(parentField, '==', parentValue)
      .limit(1)
      .get();
    
    if (parentQuery.empty) {
      return { content: [{ type: 'text', text: `No parent document found in ${parentCollection} where ${parentField} = ${parentValue}` }], isError: true };
    }
    
    const parentDoc = parentQuery.docs[0];
    const parentId = parentDoc.id;
    const parentData = parentDoc.data();
    
    // Now query the subcollection
    const subcollectionPath = `${parentCollection}/${parentId}/${subcollectionName}`;
    let subcollectionQuery: Query = db.collection(subcollectionPath);
    
    // Apply filters if provided
    for (const filter of filters) {
      let filterValue = filter.value;
      if (typeof filterValue === 'string' && !isNaN(Date.parse(filterValue))) {
        filterValue = Timestamp.fromDate(new Date(filterValue));
      }
      subcollectionQuery = subcollectionQuery.where(filter.field, filter.operator, filterValue);
    }
    
    // Apply limit
    subcollectionQuery = subcollectionQuery.limit(limit);
    
    const subcollectionSnapshot = await subcollectionQuery.get();
    const documentsData = subcollectionSnapshot.docs.map(doc => {
      const data = doc.data();
      convertTimestampsToISO(data);
      return { id: doc.id, data };
    });
    
    const projectId = getProjectId();
    
    return { 
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          parentDocument: {
            id: parentId,
            collection: parentCollection,
            data: convertTimestampsToISO(parentData)
          },
          subcollection: {
            path: subcollectionPath,
            totalCount: subcollectionSnapshot.size,
            documents: documentsData
          }
        }) 
      }]
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error querying subcollection: ${(error as Error).message}` }], isError: true };
  }
}

export async function addCadenceToZone(userId: string, zoneName: string, cadenceId: string) {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    // Path to the user's zoneList collection
    const zoneListPath = `zone/${userId}/zoneList`;
    
    // Query for the zone with the specified name
    const zoneQuery = await db.collection(zoneListPath)
      .where('zoneName', '==', zoneName)
      .limit(1)
      .get();
    
    if (zoneQuery.empty) {
      return { content: [{ type: 'text', text: `No zone found with name "${zoneName}" for user ${userId}` }], isError: true };
    }
    
    const zoneDoc = zoneQuery.docs[0];
    const zoneId = zoneDoc.id;
    
    // Add cadenceId to the cadenceIds array using arrayUnion to prevent duplicates
    await db.collection(zoneListPath).doc(zoneId).update({
      cadenceIds: FieldValue.arrayUnion(cadenceId)
    });
    
    // Get the updated zone document
    const updatedZoneDoc = await db.collection(zoneListPath).doc(zoneId).get();
    const zoneData = updatedZoneDoc.data();
    convertTimestampsToISO(zoneData);
    
    const projectId = getProjectId();
    const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/${zoneListPath}/${zoneId}`;
    
    return { 
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          message: `Successfully added cadence ${cadenceId} to zone "${zoneName}"`,
          zoneId,
          userId,
          url: consoleUrl,
          zoneData
        }) 
      }]
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error adding cadence to zone: ${(error as Error).message}` }], isError: true };
  }
}

export async function getCurrentTimestamp() {
  try {
    if (!db) {
      return { content: [{ type: 'text', text: 'Firebase is not initialized. SERVICE_ACCOUNT_KEY_PATH environment variable is required.' }], isError: true };
    }
    
    // Create a timestamp for the current server time
    const timestamp = Timestamp.now();
    
    // Convert to ISO 8601 format
    const isoString = timestamp.toDate().toISOString();
    
    // Return the ISO 8601 formatted timestamp
    return { 
      content: [{ 
        type: 'text', 
        text: isoString
      }] 
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error getting timestamp: ${(error as Error).message}` }], isError: true };
  }
}
