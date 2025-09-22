# Railway QR System API Documentation

## Overview
The Railway QR System provides RESTful APIs for managing QR codes, inspections, maintenance records, and integrations with external railway systems.

## Authentication
All API endpoints require authentication using Supabase JWT tokens, except for external integration endpoints which use API keys.

### Headers
\`\`\`
Authorization: Bearer <jwt_token>
Content-Type: application/json
\`\`\`

### External Integration Headers
\`\`\`
X-API-Key: <api_key>
Content-Type: application/json
\`\`\`

## Endpoints

### QR Codes

#### GET /api/qr-codes
Get QR codes with optional filtering.

**Query Parameters:**
- `status` - Filter by status (active, inactive, maintenance)
- `zone` - Filter by railway zone
- `division` - Filter by division
- `section` - Filter by section
- `limit` - Limit number of results
- `offset` - Offset for pagination

**Response:**
\`\`\`json
{
  "success": true,
  "data": [...],
  "count": 10
}
\`\`\`

#### POST /api/qr-codes
Create a new QR code.

**Required Fields:**
- `fitting_id` - Track fitting ID
- `zone` - Railway zone
- `division` - Division
- `section` - Section
- `km_post` - Kilometer post

**Response:**
\`\`\`json
{
  "success": true,
  "data": {...},
  "message": "QR code created successfully"
}
\`\`\`

#### GET /api/qr-codes/[id]
Get specific QR code details with related data.

#### PUT /api/qr-codes/[id]
Update QR code information (admin/supervisor only).

#### POST /api/qr-codes/scan
Record QR code scan activity.

### Inspections

#### GET /api/inspections
Get inspections with filtering options.

**Query Parameters:**
- `status` - Filter by status
- `inspection_type` - Filter by type
- `inspector_id` - Filter by inspector
- `date_from` - Start date filter
- `date_to` - End date filter
- `limit` - Limit results

#### POST /api/inspections
Create new inspection record.

**Required Fields:**
- `qr_code_id` - QR code ID
- `inspection_type` - Type of inspection
- `condition_rating` - Rating (1-5)

### Maintenance

#### GET /api/maintenance
Get maintenance records with filtering.

#### POST /api/maintenance
Create new maintenance record.

**Required Fields:**
- `qr_code_id` - QR code ID
- `maintenance_type` - Type of maintenance
- `work_description` - Description of work

### Analytics

#### GET /api/analytics
Get system analytics data (admin/supervisor only).

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "summary": {...},
    "distributions": {...},
    "recent_activity": [...]
  }
}
\`\`\`

### External Integrations

#### POST /api/external/ireps
Integration endpoint for IREPS UDM system.

**Actions:**
- `sync_track_fittings` - Sync fitting data
- `get_qr_status` - Get QR code status

#### POST /api/external/ircept
Integration endpoint for IRCEPT TMS system.

**Actions:**
- `get_track_status` - Get track status
- `update_maintenance_schedule` - Update schedule

### System

#### GET /api/health
System health check endpoint.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "database": "connected",
  "statistics": {...},
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

## Error Responses

All endpoints return consistent error responses:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
\`\`\`

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting
API endpoints are rate-limited to prevent abuse. External integration endpoints have higher limits.

## Environment Variables
Required environment variables for external integrations:
- `IREPS_API_KEY` - API key for IREPS integration
- `IRCEPT_API_KEY` - API key for IRCEPT integration
