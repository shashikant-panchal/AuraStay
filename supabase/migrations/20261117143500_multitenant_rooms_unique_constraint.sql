-- Replace legacy single-tenant UNIQUE(room_number) constraint with composite per-hotel uniqueness
ALTER TABLE IF EXISTS public.rooms DROP CONSTRAINT IF EXISTS rooms_room_number_key;
DROP INDEX IF EXISTS public.rooms_room_number_key;

DO $$
BEGIN
    IF to_regclass('public.rooms') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'rooms_hotel_room_unique'
       ) THEN
        ALTER TABLE public.rooms
            ADD CONSTRAINT rooms_hotel_room_unique UNIQUE (hotel_id, room_number);
    END IF;
END $$;
