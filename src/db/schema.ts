import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'products',
      columns: [
        { name: 'shopify_id', type: 'string' },
        { name: 'family_id', type: 'string' },
        { name: 'family_code', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'vendor', type: 'string' },
        { name: 'handle', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'material', type: 'string', isOptional: true },
        { name: 'shape', type: 'string', isOptional: true },
        { name: 'colour', type: 'string', isOptional: true },
        { name: 'colour_hex', type: 'string', isOptional: true },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'price', type: 'number' }, // cents
        { name: 'compare_at_price', type: 'number', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'images', type: 'string' }, // JSON string
        { name: 'dimensions', type: 'string' }, // JSON string
        { name: 'tags', type: 'string' }, // JSON string
        { name: 'status', type: 'string' },
        { name: 'stock_level', type: 'number' },
        { name: 'location_stock_json', type: 'string' }, // JSON string
        { name: 'sort_order', type: 'number' },
        { name: 'synced_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'clients',
      columns: [
        { name: 'foundry_id', type: 'string' },
        { name: 'first_name', type: 'string' },
        { name: 'last_name', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'lifecycle_stage', type: 'string', isOptional: true },
        { name: 'tier_tag', type: 'string', isOptional: true },
        { name: 'order_count', type: 'number' },
        { name: 'total_spent', type: 'number' }, // cents
        { name: 'last_activity_at', type: 'number', isOptional: true },
        { name: 'enrichment_json', type: 'string' }, // JSON string
        { name: 'preferences_json', type: 'string' }, // JSON string
        { name: 'tags', type: 'string' }, // JSON string
        { name: 'synced_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'appointments',
      columns: [
        { name: 'foundry_id', type: 'string' },
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'client_name', type: 'string' },
        { name: 'staff_id', type: 'string' },
        { name: 'staff_name', type: 'string' },
        { name: 'type_id', type: 'string', isOptional: true },
        { name: 'type_name', type: 'string' },
        { name: 'location_id', type: 'string' },
        { name: 'starts_at', type: 'number' },
        { name: 'ends_at', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'intake_form_type', type: 'string', isOptional: true },
        { name: 'reminder_sent_at', type: 'number', isOptional: true },
        { name: 'synced_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'local_sessions',
      columns: [
        { name: 'client_id', type: 'string', isOptional: true },
        { name: 'client_name', type: 'string', isOptional: true },
        { name: 'staff_id', type: 'string' },
        { name: 'started_at', type: 'number' },
        { name: 'ended_at', type: 'number', isOptional: true },
        { name: 'outcome_tag', type: 'string', isOptional: true },
        { name: 'frames_tried', type: 'string' }, // JSON string
        { name: 'session_notes', type: 'string', isOptional: true },
        { name: 'consent_captured_at', type: 'number', isOptional: true },
        { name: 'consent_declined', type: 'boolean' },
        { name: 'synced', type: 'boolean' },
        { name: 'last_saved_at', type: 'number' },
        { name: 'server_session_id', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'operation', type: 'string' }, // create/update/delete
        { name: 'entity_type', type: 'string' },
        { name: 'entity_id', type: 'string' },
        { name: 'endpoint', type: 'string' },
        { name: 'method', type: 'string' }, // POST/PATCH/DELETE
        { name: 'payload', type: 'string' }, // JSON string
        { name: 'priority', type: 'string' }, // high/normal/low
        { name: 'attempts', type: 'number' },
        { name: 'last_attempt_at', type: 'number', isOptional: true },
        { name: 'error', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // pending/syncing/failed/complete
        { name: 'idempotency_key', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'photo_uploads',
      columns: [
        { name: 'local_path', type: 'string' },
        { name: 'thumbnail_path', type: 'string', isOptional: true },
        { name: 'session_id', type: 'string', isOptional: true },
        { name: 'context', type: 'string' }, // fitting/second_sight/custom_design/profile
        { name: 'product_id', type: 'string', isOptional: true },
        { name: 'product_name', type: 'string', isOptional: true },
        { name: 'verdict', type: 'string', isOptional: true }, // loved/liked/unsure/rejected
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'r2_key', type: 'string', isOptional: true },
        { name: 'r2_url', type: 'string', isOptional: true },
        { name: 'uploaded_at', type: 'number', isOptional: true },
        { name: 'attempts', type: 'number' },
        { name: 'status', type: 'string' }, // pending/uploading/complete/failed
      ],
    }),
    tableSchema({
      name: 'device_config',
      columns: [
        { name: 'location_id', type: 'string' },
        { name: 'staff_id', type: 'string' },
        { name: 'last_full_sync_at', type: 'number', isOptional: true },
        { name: 'last_incremental_sync_at', type: 'number', isOptional: true },
        { name: 'app_version', type: 'string' },
        { name: 'upload_on_cellular', type: 'boolean' },
        { name: 'privacy_mode', type: 'string' }, // staff/client
      ],
    }),
  ],
});