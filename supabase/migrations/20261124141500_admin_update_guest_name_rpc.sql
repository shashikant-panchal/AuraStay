-- ============================================================================
-- Aavasa Enterprise PMS: Atomic Guest Name Edit RPC
-- Updates a reservation's guest name and cascades atomically to the actively
-- linked room row and any saved financial invoice/folio row in 1 single RPC
-- call (Free-Tier Nano optimized: 1 request, 1 transaction, indexed lookups).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_reservation_guest_name(
    p_hotel_id TEXT,
    p_reservation_id TEXT,
    p_guest_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hotel_id TEXT := NULLIF(BTRIM(p_hotel_id), '');
    v_res_id TEXT := NULLIF(BTRIM(p_reservation_id), '');
    v_guest_name TEXT := NULLIF(BTRIM(p_guest_name), '');
    v_updated public.reservations%ROWTYPE;
BEGIN
    IF v_hotel_id IS NULL THEN
        RAISE EXCEPTION 'Hotel ID is required.';
    END IF;

    IF v_res_id IS NULL THEN
        RAISE EXCEPTION 'Reservation ID is required.';
    END IF;

    IF v_guest_name IS NULL THEN
        RAISE EXCEPTION 'Customer name cannot be empty.';
    END IF;

    IF char_length(v_guest_name) > 150 THEN
        v_guest_name := LEFT(v_guest_name, 150);
    END IF;

    IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.has_hotel_access(v_hotel_id) THEN
        RAISE EXCEPTION 'Forbidden: Unauthorized tenant access.';
    END IF;

    UPDATE public.reservations
    SET guest = v_guest_name,
        updated_at = NOW()
    WHERE id = v_res_id
      AND hotel_id = v_hotel_id
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation #% was not found for this property.', v_res_id;
    END IF;

    -- Cascade to actively linked physical room (uses idx_rooms_booking_id)
    UPDATE public.rooms
    SET guest = v_guest_name,
        updated_at = NOW()
    WHERE hotel_id = v_hotel_id
      AND booking_id = v_res_id;

    -- Cascade to saved financial invoices / folios (uses idx_financial_invoices_reservation_id)
    UPDATE public.financial_invoices
    SET client_name = v_guest_name,
        updated_at = NOW()
    WHERE hotel_id = v_hotel_id
      AND reservation_id = v_res_id;

    RETURN jsonb_build_object(
        'id', v_updated.id,
        'hotel_id', v_updated.hotel_id,
        'guest', v_updated.guest,
        'room_number', v_updated.room_number,
        'updated_at', v_updated.updated_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_reservation_guest_name(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_reservation_guest_name(TEXT, TEXT, TEXT) TO authenticated, service_role;
