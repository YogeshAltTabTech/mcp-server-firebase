Valid Firestore collections names:
Authentication
cadence
event
experiences
goal
milestone
network
syncs
users
zone

Relationship between collections:

## 1. Users Collection
- Stores user profile data (userId, displayName, email, avatar, etc.)
- Contains linked account information for integration with external services
- Referenced by almost all other collections
- Collection path: `users`

## 2. Zone Collection
- Acts as a top-level organizational structure
- Users can create multiple zones to organize their activities
- Contains: `id`, `zoneName`, `ownerId`, `cadenceIds`, `colorCode`, etc.
- Zones can be linked to external accounts (Google, Microsoft)
- Collection path: `zone/{user_id}/zoneList`

## 3. Cadence Collection
- Represents recurring meetings or routines
- Belongs to a specific zone (`zoneId`)
- Has members (`membersId`, `ownerId`, `placeholderMembersId`)
- Parent to goals
- Collection path: `cadence`

## 4. Goal Collection
- Associated with a specific cadence (`cadenceId`)
- Has owner and members (`ownerId`, `membersId`, `placeholderMembersId`)
- Parent to milestones
- Contains priority, title, description, and completion status
- Collection path: `goal`

## 5. Milestone Collection
- Belongs to a specific goal (`goalId`)
- Contains a list of events (`eventModelList`)
- Acts as an intermediary between goals and events
- Each milestone represents a step toward achieving a goal

## 6. Event Collection
- Represents one-time or recurring calendar events
- Can be associated with:
- Cadences (`cadenceId`)
- Zones (`zoneId`)
- Milestones (`milestoneId`) 
- Contains meeting details (time, duration, description)
- Has an owner and members
- Collection path: `event`

## 7. Syncs Collection
- Used for synchronization with external calendars/services
- Contains sync metadata and status information
- Collection path: `syncs`

## 8. Experience Collection
- Appears to store user experiences or achievements
- Collection path: `experiences`

## 9. Network Collection
- Likely stores user connections/relationships
- Referenced in various service files
- Collection path: `network`

## 10. Authentication Collection
- Not directly represented in models but is used for auth processes
- Likely stores authentication tokens and provider information

## Hierarchical Relationship
The data in the application is organized in a hierarchical structure:

```
User
└── Zones (different areas of life/work)
    └── Cadences (recurring meetings/routines)
            └── Goals (objectives to accomplish)
                └── Milestones (steps to achieve a goal)
                    └── Events (calendar appointments to work on milestones)
```

Each entity references the IDs of its parent and can also reference user IDs for ownership and membership.

Firestore Collection Schemas

Below are the schemas for each Firestore collection in your application using standard Firestore data types. These can be used for create and update operations.

## 1. Users Collection

User {
userId: string
displayName: string
email: string
avatar: string
loginProvider: string (enum: "GOOGLE", "MICROSOFT", "EMAIL")
accessToken: string (optional)
refreshToken: string (optional)
createdAt: string or timestamp
firstName: string
lastName: string
phone: string
dob: string
onboarded: boolean
countryCode: string
role: string
linkedAccounts: array of map {
    uid: string
    email: string
    displayName: string
    accessToken: string
    refreshToken: string
    provider: string (enum: "GOOGLE", "MICROSOFT")
    photoUrl: string (optional)
}
sleepDuration: number
isMsftAccount: boolean
isRebalancingEnabled: boolean
aboutMe: string (optional)
callStatus: string (enum: "available", "inCall", "busy")
activeCallRoomId: string (optional)
pendingCallInvite: string (optional)
callerAvatar: string (optional)
callerName: string (optional)
coverPicture: string (optional)
location: string (optional)
}

## 2. Zone Collection

Zone {
id: string
zoneName: string
ownerId: string
cadenceIds: array of string
colorCode: string
isLinked: boolean
linkedAccounts: map (optional) {
    uid: string
    email: string
    displayName: string
    accessToken: string
    refreshToken: string
    provider: string
    photoUrl: string (optional)
}
allocationPercentage: number
}

## 3. Cadence Collection

Cadence {
cadenceId: string
zoneId: string
ownerId: string
sprintId: string (optional)
cadenceTitle: string
cadenceDesc: string
priority: string (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
membersId: array of string
invitation: array of string
placeholderMembersId: array of string
meetId: string (optional)
eventId: string (optional)
recurrenceRule: string (optional)
durationInMin: number
meetTime: string
colorCode: string
createMeet: boolean
meetProvider: string (enum: "GOOGLE", "MICROSOFT")
exceptions: map of string to map {
    newTime: string
}
createdAt: timestamp
}

## 4. Goal Collection

Goal {
goalId: string
cadenceId: string
goalTitle: string
goalDesc: string
priority: string (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
ownerId: string
colorCode: string
membersId: array of string
placeholderMembersId: array of string
completed: boolean
doneTime: timestamp (optional)
createdAt: timestamp
}

## 5. Milestone Collection

Milestone {
milestoneId: string
milestoneTitle: string
goalId: string
eventModelList: array of map {
    eventId: string
    meetId: string (optional)
    meetLink: string (optional)
    eventTitle: string
    eventDesc: string
    ownerId: string
    priority: string (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
    type: string (enum: "ONETIME", "RECURRING", "SYNC")
    recurrenceRule: string (optional)
    durationInMin: number
    meetTime: string
    colorCode: string
    zoneId: string
    cadenceId: string (optional)
    milestoneId: string (optional)
    membersId: array of string
    meetProvider: string (enum: "GOOGLE", "MICROSOFT")
    completed: boolean
    exceptions: map of string to map {
        newTime: string
    }
    meetDate: timestamp (optional)
    createdAt: timestamp
    }
}

## 6. Event Collection

Event {
eventId: string
meetId: string (optional)
meetLink: string (optional)
eventTitle: string
eventDesc: string
ownerId: string
priority: string (enum: "LOW", "MEDIUM", "HIGH", "CRITICAL")
type: string (enum: "ONETIME", "RECURRING", "SYNC")
recurrenceRule: string (optional)
durationInMin: number
meetTime: string
colorCode: string
zoneId: string
cadenceId: string (optional)
milestoneId: string (optional)
membersId: array of string
meetProvider: string (enum: "GOOGLE", "MICROSOFT")
completed: boolean
exceptions: map of string to map {
    newTime: string
}
meetDate: timestamp (optional)
createdAt: timestamp
}

## 7. Sync Collection

Sync {
syncId: string
ownerId: string
title: string
description: string (optional)
startTime: timestamp
endTime: timestamp
location: string (optional)
participantEmails: array of string
membersId: array of string
isRecurring: boolean
recurrenceRule: string (optional)
status: string (enum: "scheduled", "completed", "cancelled")
source: string (enum: "google", "microsoft", "manual")
externalId: string (optional)
createdAt: timestamp
}

## 8. Experience Collection

Experience {
experienceId: string
userId: string
title: string
description: string
category: string
skillsGained: array of string
startDate: timestamp
endDate: timestamp (optional)
isCurrent: boolean
organization: string (optional)
role: string (optional)
location: string (optional)
achievements: array of string
mediaUrls: array of string
isPublic: boolean
createdAt: timestamp
}

## 9. Network Collection

Network {
networkId: string
userId: string
connectionId: string
connectionType: string (enum: "direct", "pending", "blocked")
createdAt: timestamp
updatedAt: timestamp
notes: string (optional)
tags: array of string (optional)
lastInteractionDate: timestamp (optional)
}

## 10. Authentication Collection

Authentication {
userId: string
email: string
providerId: string (enum: "google.com", "microsoft.com", "password")
providerUid: string
createdAt: timestamp
lastSignInAt: timestamp
displayName: string (optional)
photoURL: string (optional)
emailVerified: boolean
disabled: boolean
refreshTokens: array of string (optional)
}

# Firestore AI Model Interaction Guide

This guide provides comprehensive instructions for AI models to interact with Firebase collections through the MCP server. The model should already know the user ID it's working with and can use these instructions to perform read, create, and update operations on documents related to that user.

## Overview of Available Tools

The MCP server provides the following tools for interacting with Firebase:

### Firestore Operations
- `firestore_list_collections`: List collections or subcollections
- `firestore_list_documents`: List documents from a collection with optional filtering
- `firestore_get_document`: Get a specific document by ID
- `firestore_add_document`: Add a new document to a collection
- `firestore_update_document`: Update an existing document
- `firestore_delete_document`: Delete a document
- `firestore_update_array_field`: Update an array field in a document (add/remove elements)
- `firestore_query_subcollection`: Query documents in a subcollection
- `firestore_add_cadence_to_zone`: Add a cadence ID to a zone's cadenceIds array

### Authentication Operations
- `auth_get_user`: Get user information by ID or email

### Storage Operations
- `storage_list_files`: List files in Firebase Storage
- `storage_get_file_info`: Get file information including metadata and download URL

## Authentication Collection

The Authentication collection contains user authentication details. As an AI model, you will primarily read from this collection, not create or update documents directly.

### Reading Authentication Data

1. Get User Authentication Details by ID:
   
   Tool: auth_get_user
   Arguments:
     identifier: "user123"  # Use the user ID you already know
   
2. Get User Authentication Details by Email:
   
   Tool: auth_get_user
   Arguments:
     identifier: "user@example.com"  # Use the user's email if ID is unknown
   
### Interpreting Authentication Results

The response will contain the user's authentication information, including:
- UID (User ID)
- Email
- Email verification status
- Display name
- Photo URL
- Provider information
- Account creation timestamp
- Last sign-in timestamp

## Users Collection

The users collection stores user profile data. This collection is central to most operations as it contains core user information.

### Reading User Data

1. Get a User Document by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "users"
     id: "user123"  # Use the user ID you already know
   
2. List Users with Filtering (admin operation, use carefully):
   
   Tool: firestore_list_documents
   Arguments:
     collection: "users"
     filters:
       - field: "email"
         operator: "=="
         value: "user@example.com"
   
### Creating a New User Profile

Typically, user profiles are created during authentication, but you might need to create or update profile data:

Tool: firestore_add_document
Arguments:
  collection: "users"
  data:
    userId: "user123"  # Use the ID from authentication
    displayName: "User Name"
    email: "user@example.com"
    avatar: "https://example.com/avatar.jpg"
    firstName: "First"
    lastName: "Last"
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format
    onboarded: false
    role: "user"
    linkedAccounts: []  # Initially empty

### Updating User Profile

Tool: firestore_update_document
Arguments:
  collection: "users"
  id: "user123"  # Use the user ID you already know
  data:
    displayName: "Updated Name"
    aboutMe: "This is my updated profile"
    callStatus: "available"

### Updating User's Linked Accounts

Use the array field update tool to manage linked accounts:

1. Add a Linked Account:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "users"
     id: "user123"
     field: "linkedAccounts"
     value:
       uid: "provider123"
       email: "user@provider.com"
       displayName: "User at Provider"
       accessToken: "token123"
       refreshToken: "refresh123"
       provider: "GOOGLE"
       photoUrl: "https://provider.com/photo.jpg"
     operation: "add"
   
2. Remove a Linked Account:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "users"
     id: "user123"
     field: "linkedAccounts"
     value:
       uid: "provider123"
       provider: "GOOGLE"
     operation: "remove"
   
## Zone Collection

Zones are organizational structures for users' activities. Each user can have multiple zones, stored in a subcollection path: `zone/{user_id}/zoneList`.

### Reading Zone Data

1. List All Zones for a User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "zone/user123/zoneList"  # Replace user123 with the actual user ID
     limit: 50  # Adjust as needed
   
2. Get a Specific Zone by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "zone/user123/zoneList"  # Replace user123 with the actual user ID
     id: "zone456"  # The zone ID
   
3. Find a Zone by Name:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "zone/user123/zoneList"  # Replace user123 with the actual user ID
     filters:
       - field: "zoneName"
         operator: "=="
         value: "Work Zone"
   
### Creating a New Zone

Tool: firestore_add_document
Arguments:
  collection: "zone/user123/zoneList"  # Replace user123 with the actual user ID
  data:
    zoneName: "Personal Projects"
    ownerId: "user123"  # The user ID
    cadenceIds: []  # Initially empty, will be filled as cadences are created
    colorCode: "#4287f5"
    isLinked: false
    allocationPercentage: 25  # Example percentage

### Updating a Zone

Tool: firestore_update_document
Arguments:
  collection: "zone/user123/zoneList"  # Replace user123 with the actual user ID
  id: "zone456"  # The zone ID
  data:
    zoneName: "Updated Zone Name"
    colorCode: "#42f587"
    allocationPercentage: 30

### Adding a Cadence to a Zone

This operation uses a special tool provided by the MCP server:

Tool: firestore_add_cadence_to_zone
Arguments:
  userId: "user123"  # The user ID
  zoneName: "Work Zone"  # The name of the zone
  cadenceId: "cadence789"  # The ID of the cadence to add

Alternatively, you can update the cadenceIds array directly:

Tool: firestore_update_array_field
Arguments:
  collection: "zone/user123/zoneList"  # Replace user123 with the actual user ID
  id: "zone456"  # The zone ID
  field: "cadenceIds"
  value: "cadence789"  # The cadence ID to add
  operation: "add"

## Cadence Collection

Cadences represent recurring meetings or routines and belong to specific zones.

### Reading Cadence Data

1. Get a Specific Cadence by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "cadence"
     id: "cadence789"  # The cadence ID
   
2. List Cadences for a Specific User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "cadence"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
   
3. List Cadences for a Specific Zone:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "cadence"
     filters:
       - field: "zoneId"
         operator: "=="
         value: "zone456"  # The zone ID
   
### Creating a New Cadence

Tool: firestore_add_document
Arguments:
  collection: "cadence"
  data:
    zoneId: "zone456"  # The zone this cadence belongs to
    ownerId: "user123"  # The user ID
    cadenceTitle: "Weekly Team Sync"
    cadenceDesc: "Regular team synchronization meeting"
    priority: "HIGH"
    membersId: ["user123", "user456"]  # IDs of members
    invitation: []  # IDs of invited users
    placeholderMembersId: []  # IDs of placeholder members
    durationInMin: 60
    meetTime: "2023-07-01T10:00:00Z"  # ISO format date string
    colorCode: "#4287f5"
    createMeet: true
    meetProvider: "GOOGLE"
    exceptions: {}
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format

After creating a cadence, remember to add it to the corresponding zone using the methods shown in the Zone section.

### Updating a Cadence

Tool: firestore_update_document
Arguments:
  collection: "cadence"
  id: "cadence789"  # The cadence ID
  data:
    cadenceTitle: "Updated Weekly Team Sync"
    cadenceDesc: "Updated description"
    priority: "MEDIUM"
    durationInMin: 45

### Managing Cadence Members

1. Add a Member to a Cadence:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "cadence"
     id: "cadence789"  # The cadence ID
     field: "membersId"
     value: "user789"  # The user ID to add
     operation: "add"
   
2. Remove a Member from a Cadence:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "cadence"
     id: "cadence789"  # The cadence ID
     field: "membersId"
     value: "user789"  # The user ID to remove
     operation: "remove"
   
## Goal Collection

Goals are objectives associated with specific cadences. Each goal can have multiple milestones.

### Reading Goal Data

1. Get a Specific Goal by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "goal"
     id: "goal123"  # The goal ID
   
2. List Goals for a Specific User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "goal"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
   
3. List Goals for a Specific Cadence:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "goal"
     filters:
       - field: "cadenceId"
         operator: "=="
         value: "cadence789"  # The cadence ID
   
4. List Active (Incomplete) Goals for a User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "goal"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
       - field: "completed"
         operator: "=="
         value: false
   
### Creating a New Goal

Tool: firestore_add_document
Arguments:
  collection: "goal"
  data:
    cadenceId: "cadence789"  # The cadence this goal belongs to
    goalTitle: "Implement New Feature"
    goalDesc: "Complete the implementation of the new dashboard feature"
    priority: "HIGH"
    ownerId: "user123"  # The user ID who owns this goal
    colorCode: "#4287f5"
    membersId: ["user123", "user456"]  # IDs of members
    placeholderMembersId: []  # IDs of placeholder members
    completed: false
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format

### Updating a Goal

Tool: firestore_update_document
Arguments:
  collection: "goal"
  id: "goal123"  # The goal ID
  data:
    goalTitle: "Updated Feature Implementation"
    goalDesc: "Updated description for the dashboard feature"
    priority: "CRITICAL"

### Marking a Goal as Complete

Tool: firestore_update_document
Arguments:
  collection: "goal"
  id: "goal123"  # The goal ID
  data:
    completed: true
    doneTime: "2023-07-15T10:30:00Z"  # Current time in ISO format

### Managing Goal Members

1. Add a Member to a Goal:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "goal"
     id: "goal123"  # The goal ID
     field: "membersId"
     value: "user789"  # The user ID to add
     operation: "add"
   
2. Remove a Member from a Goal:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "goal"
     id: "goal123"  # The goal ID
     field: "membersId"
     value: "user789"  # The user ID to remove
     operation: "remove"
   
## Milestone Collection

Milestones are steps toward achieving a goal. Each milestone can have multiple events.

### Reading Milestone Data

1. Get a Specific Milestone by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "milestone"
     id: "milestone456"  # The milestone ID
   
2. List Milestones for a Specific Goal:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "milestone"
     filters:
       - field: "goalId"
         operator: "=="
         value: "goal123"  # The goal ID
   
### Creating a New Milestone

Tool: firestore_add_document
Arguments:
  collection: "milestone"
  data:
    milestoneTitle: "Complete Backend Integration"
    goalId: "goal123"  # The goal this milestone belongs to
    eventModelList: []  # Initially empty, will be filled as events are created

### Updating a Milestone

Tool: firestore_update_document
Arguments:
  collection: "milestone"
  id: "milestone456"  # The milestone ID
  data:
    milestoneTitle: "Updated Backend Integration"

### Adding an Event to a Milestone

Events are typically managed separately in the event collection, but they can be referenced in the milestone's eventModelList:

Tool: firestore_update_document
Arguments:
  collection: "milestone"
  id: "milestone456"  # The milestone ID
  data:
    eventModelList:
      - eventId: "event789"
        eventTitle: "Backend Integration Meeting"
        eventDesc: "Discussion about API integration"
        ownerId: "user123"
        priority: "HIGH"
        type: "ONETIME"
        durationInMin: 60
        meetTime: "2023-07-15T14:00:00Z"
        colorCode: "#4287f5"
        zoneId: "zone456"
        membersId: ["user123", "user456"]
        completed: false
        createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format

Alternatively, you can use the array field update:

Tool: firestore_update_array_field
Arguments:
  collection: "milestone"
  id: "milestone456"  # The milestone ID
  field: "eventModelList"
  value:
    eventId: "event789"
    eventTitle: "Backend Integration Meeting"
    eventDesc: "Discussion about API integration"
    ownerId: "user123"
    priority: "HIGH"
    type: "ONETIME"
    durationInMin: 60
    meetTime: "2023-07-15T14:00:00Z"
    colorCode: "#4287f5"
    zoneId: "zone456"
    membersId: ["user123", "user456"]
    completed: false
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format
  operation: "add"

## Event Collection

Events represent calendar appointments or tasks and can be associated with cadences, zones, and milestones.

### Reading Event Data

1. Get a Specific Event by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "event"
     id: "event789"  # The event ID
   
2. List Events for a Specific User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "event"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
   
3. List Events for a Specific Zone:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "event"
     filters:
       - field: "zoneId"
         operator: "=="
         value: "zone456"  # The zone ID
   
4. List Events for a Specific Cadence:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "event"
     filters:
       - field: "cadenceId"
         operator: "=="
         value: "cadence789"  # The cadence ID
   
5. List Events for a Date Range:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "event"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
       - field: "meetTime"
         operator: ">="
         value: "2023-07-01T00:00:00Z"  # Start of range
       - field: "meetTime"
         operator: "<="
         value: "2023-07-31T23:59:59Z"  # End of range
   
6. List Incomplete Events:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "event"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
       - field: "completed"
         operator: "=="
         value: false
   
### Creating a New Event

Tool: firestore_add_document
Arguments:
  collection: "event"
  data:
    eventTitle: "Design Review Meeting"
    eventDesc: "Review the latest UI designs for the dashboard feature"
    ownerId: "user123"  # The user ID
    priority: "MEDIUM"
    type: "ONETIME"  # ONETIME, RECURRING, or SYNC
    recurrenceRule: null  # For recurring events, use the RRULE format
    durationInMin: 60
    meetTime: "2023-07-15T14:00:00Z"  # ISO format date string
    colorCode: "#4287f5"
    zoneId: "zone456"  # The zone this event belongs to
    cadenceId: "cadence789"  # Optional, if related to a cadence
    milestoneId: "milestone456"  # Optional, if related to a milestone
    membersId: ["user123", "user456"]  # IDs of members
    meetProvider: "GOOGLE"  # GOOGLE or MICROSOFT
    completed: false
    exceptions: {}  # For recurring events with exceptions
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format

For a recurring event, include a recurrence rule:

Tool: firestore_add_document
Arguments:
  collection: "event"
  data:
    eventTitle: "Weekly Design Review"
    # ... other fields as above
    type: "RECURRING"
    recurrenceRule: "FREQ=WEEKLY;BYDAY=MO"
    # ... remaining fields

### Updating an Event

Tool: firestore_update_document
Arguments:
  collection: "event"
  id: "event789"  # The event ID
  data:
    eventTitle: "Updated Design Review Meeting"
    eventDesc: "Updated description for the design review"
    priority: "HIGH"
    durationInMin: 90

### Marking an Event as Complete

Tool: firestore_update_document
Arguments:
  collection: "event"
  id: "event789"  # The event ID
  data:
    completed: true

### Managing Event Members

1. Add a Member to an Event:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "event"
     id: "event789"  # The event ID
     field: "membersId"
     value: "user789"  # The user ID to add
     operation: "add"
   
2. Remove a Member from an Event:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "event"
     id: "event789"  # The event ID
     field: "membersId"
     value: "user789"  # The user ID to remove
     operation: "remove"
   
## Syncs Collection

The Syncs collection stores synchronization data for external calendar services.

### Reading Sync Data

1. Get a Specific Sync by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "syncs"
     id: "sync123"  # The sync ID
   
2. List Syncs for a Specific User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "syncs"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
   
3. List Syncs by Status:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "syncs"
     filters:
       - field: "ownerId"
         operator: "=="
         value: "user123"  # The user ID
       - field: "status"
         operator: "=="
         value: "completed"  # Status: scheduled, completed, cancelled
   
### Creating a New Sync

Tool: firestore_add_document
Arguments:
  collection: "syncs"
  data:
    ownerId: "user123"  # The user ID
    title: "Google Calendar Sync"
    description: "Automatic sync with Google Calendar"
    startTime: "2023-07-01T00:00:00Z"  # ISO date string
    endTime: "2023-07-31T23:59:59Z"  # ISO date string
    participantEmails: ["user@example.com", "colleague@example.com"]
    membersId: ["user123", "user456"]  # IDs of members
    isRecurring: false
    status: "scheduled"  # scheduled, completed, cancelled
    source: "google"  # google, microsoft, manual
    externalId: "google_calendar_123"  # ID from external service
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format

### Updating a Sync

Tool: firestore_update_document
Arguments:
  collection: "syncs"
  id: "sync123"  # The sync ID
  data:
    title: "Updated Google Calendar Sync"
    description: "Updated sync description"
    status: "completed"

## Experiences Collection

The Experiences collection stores user achievements or experiences.

### Reading Experience Data

1. Get a Specific Experience by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "experiences"
     id: "experience123"  # The experience ID
   
2. List Experiences for a Specific User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "experiences"
     filters:
       - field: "userId"
         operator: "=="
         value: "user123"  # The user ID
   
3. List Public Experiences Only:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "experiences"
     filters:
       - field: "userId"
         operator: "=="
         value: "user123"  # The user ID
       - field: "isPublic"
         operator: "=="
         value: true
   
### Creating a New Experience

Tool: firestore_add_document
Arguments:
  collection: "experiences"
  data:
    userId: "user123"  # The user ID
    title: "Completed Dashboard Project"
    description: "Led a team to successfully implement a new dashboard feature"
    category: "Project"
    skillsGained: ["Project Management", "UI/UX Design", "React"]
    startDate: "2023-06-01T00:00:00Z"  # ISO date string
    endDate: "2023-07-15T00:00:00Z"  # ISO date string
    isCurrent: false
    organization: "Company XYZ"
    role: "Project Lead"
    location: "Remote"
    achievements: ["Delivered ahead of schedule", "Positive user feedback"]
    mediaUrls: ["https://example.com/project-image.jpg"]
    isPublic: true
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format

### Updating an Experience

Tool: firestore_update_document
Arguments:
  collection: "experiences"
  id: "experience123"  # The experience ID
  data:
    title: "Updated Dashboard Project"
    description: "Updated project description"
    isPublic: false

### Managing Experience Skills

1. Add a Skill to an Experience:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "experiences"
     id: "experience123"  # The experience ID
     field: "skillsGained"
     value: "TypeScript"  # The skill to add
     operation: "add"
   
2. Remove a Skill from an Experience:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "experiences"
     id: "experience123"  # The experience ID
     field: "skillsGained"
     value: "React"  # The skill to remove
     operation: "remove"
   
## Network Collection

The Network collection stores user connections and relationships.

### Reading Network Data

1. Get a Specific Network Connection by ID:
   
   Tool: firestore_get_document
   Arguments:
     collection: "network"
     id: "network123"  # The network connection ID
   
2. List Network Connections for a User:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "network"
     filters:
       - field: "userId"
         operator: "=="
         value: "user123"  # The user ID
   
3. List Connections by Type:
   
   Tool: firestore_list_documents
   Arguments:
     collection: "network"
     filters:
       - field: "userId"
         operator: "=="
         value: "user123"  # The user ID
       - field: "connectionType"
         operator: "=="
         value: "direct"  # Connection type: direct, pending, blocked
   
### Creating a New Network Connection

Tool: firestore_add_document
Arguments:
  collection: "network"
  data:
    userId: "user123"  # The user ID
    connectionId: "user456"  # The ID of the connected user
    connectionType: "direct"  # direct, pending, blocked
    createdAt: "2023-07-15T10:30:00Z"  # Current time in ISO format
    updatedAt: "2023-07-15T10:30:00Z"  # Current time in ISO format
    notes: "Met at conference"  # Optional notes
    tags: ["colleague", "project-partner"]  # Optional tags
    lastInteractionDate: "2023-07-15T10:30:00Z"  # Current time in ISO format

### Updating a Network Connection

Tool: firestore_update_document
Arguments:
  collection: "network"
  id: "network123"  # The network connection ID
  data:
    connectionType: "direct"  # Update from pending to direct
    updatedAt: "2023-07-15T10:30:00Z"  # Current time in ISO format
    notes: "Updated connection notes"

### Managing Network Connection Tags

1. Add a Tag to a Network Connection:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "network"
     id: "network123"  # The network connection ID
     field: "tags"
     value: "mentor"  # The tag to add
     operation: "add"
   
2. Remove a Tag from a Network Connection:
   
   Tool: firestore_update_array_field
   Arguments:
     collection: "network"
     id: "network123"  # The network connection ID
     field: "tags"
     value: "colleague"  # The tag to remove
     operation: "remove"
   
## Common Patterns & Best Practices

When working with the Firebase MCP server, follow these best practices to ensure efficient and effective operations:

### 1. Always Filter by User ID

When querying collections, always include the user ID in your filters to ensure you're only accessing data relevant to the current user:

Tool: firestore_list_documents
Arguments:
  collection: "event"
  filters:
    - field: "ownerId"  # or userId, depending on the collection
      operator: "=="
      value: "user123"  # The user ID you're working with
  # Additional filters as needed

### 2. Use ISO Date Strings for Timestamps

When working with dates, use ISO format strings for consistency:

# When creating or updating documents with date fields
Tool: firestore_add_document
Arguments:
  collection: "event"
  data:
    meetTime: "2023-07-15T14:00:00Z"  # ISO format date string
    createdAt: "2023-07-15T10:30:00Z"  # ISO format date string

### 3. Hierarchical Data Access Pattern

Follow these steps when accessing related documents:

1. Start with the user (Get user data)
   
   Tool: firestore_get_document
   Arguments:
     collection: "users"
     id: "user123"

2. Get zones for that user
   
   Tool: firestore_query_subcollection
   Arguments:
     parentCollection: "zone"
     parentField: "__name__"
     parentValue: "user123"
     subcollectionName: "zoneList"
   
3. Access cadences for a specific zone
   
   Tool: firestore_list_documents
   Arguments:
     collection: "cadence"
     filters:
       - field: "zoneId"
         operator: "=="
         value: "zone456"

4. Follow similar patterns for goals, milestones, and events

### 4. Batch Related Updates

When creating related entities, make sure to update the parent entities as well:

# After creating a cadence, add it to the zone
Tool: firestore_update_array_field
Arguments:
  collection: "zone/user123/zoneList"
  id: "zone456"
  field: "cadenceIds"
  value: "cadence789"  # The newly created cadence ID
  operation: "add"

### 5. Check for Existence Before Creating

Before creating a new document, check if it already exists to avoid duplicates:

# First check if the zone exists
Tool: firestore_list_documents
Arguments:
  collection: "zone/user123/zoneList"
  filters:
    - field: "zoneName"
      operator: "=="
      value: "Work Zone"

# Based on response, either create new zone or use existing one


### 6. Handle Pagination for Large Result Sets

When dealing with potentially large result sets, implement pagination:

# Initial query
Tool: firestore_list_documents
Arguments:
  collection: "event"
  filters:
    - field: "ownerId"
      operator: "=="
      value: "user123"
  limit: 20

# After receiving response, extract the pageToken and use for next query

# If pageToken exists in the response
Tool: firestore_list_documents
Arguments:
  collection: "event"
  filters:
    - field: "ownerId"
      operator: "=="
      value: "user123"
  limit: 20
  pageToken: "token_from_previous_response"


### 7. Error Handling

Always check for errors in the responses before proceeding:

# First make a request
Tool: firestore_get_document
Arguments:
  collection: "users"
  id: "user123"

# Then check if the response contains isError: true
# If error exists, take appropriate action
# If no error, proceed with using the document data


By following these patterns and best practices, you can effectively interact with the Firebase collections through the MCP server while maintaining data integrity and security.
