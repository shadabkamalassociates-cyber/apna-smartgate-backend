const { client } = require("../config/client");

function parseOptionalInt(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalNumeric(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const createEvent = async (req, res) => {
  try {
    const b = req.body ?? {};

    const society_id = b.society_id;
    const title = typeof b.title === "string" ? b.title.trim() : b.title;
    const description = b.description ?? null;
    const date = b.date;
    const time = b.time;
    const location = b.location ?? null;
    const max_participants = parseOptionalInt(b.max_participants);

    const is_paid =
      b.is_paid === undefined || b.is_paid === null
        ? false
        : b.is_paid === true || b.is_paid === "true" || b.is_paid === 1 || b.is_paid === "1";

    const priceRaw = parseOptionalNumeric(b.price);
    const price = is_paid ? priceRaw ?? 0 : 0;

    const created_by = req.user?.id ?? b.created_by;

    if (!society_id || !title || !date || !time || !created_by) {
      return res.status(400).json({
        success: false,
        message: "society, title, date, time, and created_by are required",
      });
    }

    if (is_paid && (priceRaw === null || price < 0)) {
      return res.status(400).json({
        success: false,
        message: "price must be a non-negative number when is_paid is true",
      });
    }

    const event = await client.query(
      `INSERT INTO events (
        society_id, title, description, date, time,
        location, max_participants, is_paid, price, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        society_id,
        title,
        description,
        date,
        time,
        location,
        max_participants,
        is_paid,
        price,
        created_by,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT * FROM events ORDER BY created_at DESC",
    );
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getEventsBySociety = async (req, res) => {
  try {
    const society_id = req.query.society_id ?? req.params.society_id;
    if (!society_id) {
      return res.status(400).json({
        success: false,
        message: "society_id is required",
      });
    }

    const result = await client.query(
      "SELECT * FROM events WHERE society_id = $1 ORDER BY date DESC, time DESC",
      [society_id],
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const b = req.body ?? {};
    const id = b.id ?? req.params.id ?? req.query.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const sets = [];
    const vals = [];
    let i = 1;

    const add = (col, val) => {
      if (val !== undefined) {
        sets.push(`${col} = $${i}`);
        vals.push(val);
        i += 1;
      }
    };

    if (b.title !== undefined) {
      const t = typeof b.title === "string" ? b.title.trim() : b.title;
      if (!t) {
        return res.status(400).json({
          success: false,
          message: "title cannot be empty",
        });
      }
      add("title", t);
    }
    add("description", b.description);
    add("date", b.date);
    add("time", b.time);
    add("location", b.location);
    if (b.max_participants !== undefined)
      add("max_participants", parseOptionalInt(b.max_participants));

    if (b.is_paid !== undefined || b.price !== undefined) {
      const is_paid =
        b.is_paid === undefined || b.is_paid === null
          ? undefined
          : b.is_paid === true ||
            b.is_paid === "true" ||
            b.is_paid === 1 ||
            b.is_paid === "1";

      const priceRaw = parseOptionalNumeric(b.price);

      if (is_paid !== undefined) add("is_paid", is_paid);
      if (priceRaw !== null) add("price", priceRaw);
    }

    if (sets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    vals.push(id);
    const result = await client.query(
      `UPDATE events
       SET ${sets.join(", ")}
       WHERE id = $${i}
       RETURNING *`,
      vals,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const id = req.body?.id ?? req.params.id ?? req.query.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const result = await client.query(
      "DELETE FROM events WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  getEventsBySociety,
};