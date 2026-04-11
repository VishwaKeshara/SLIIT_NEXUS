import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { bookingApi, resourceApi } from "../../services/api";

export const resourceTypes = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
export const resourceStatuses = ["ACTIVE", "OUT_OF_SERVICE"];
export const calendarSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const csvTemplateHeaders = ["Name", "Type", "Capacity", "Location", "Available From", "Available To", "Status", "Description"];

export const campusLocations = {
  LECTURE_HALL: [
    "Main Building - Lecture Hall A",
    "Main Building - Lecture Hall B",
    "Main Building - Lecture Hall C",
    "Engineering Block - Hall 1",
    "Business Faculty - Hall 2",
  ],
  LAB: [
    "Computing Block - Lab 1",
    "Computing Block - Lab 2",
    "Computing Block - Lab 3",
    "Engineering Block - Hardware Lab",
    "Science Block - Network Lab",
  ],
  MEETING_ROOM: [
    "Administration Block - Meeting Room 1",
    "Administration Block - Meeting Room 2",
    "Library Building - Discussion Room",
    "Research Center - Conference Room",
  ],
  EQUIPMENT: [
    "Media Unit - Asset Room",
    "Main Building - Equipment Store",
    "Engineering Block - AV Store",
    "Media Unit - Camera Store",
    "Communication Office - Equipment Desk",
    "Main Building - Asset Room",
  ],
};

const resourceNameBases = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Computer Lab",
  MEETING_ROOM: "Meeting Room",
  EQUIPMENT: "Projector",
};

const resourceSuggestionTemplates = {
  LECTURE_HALL: [
    {
      capacity: "120",
      availableFrom: "08:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Large lecture hall with projector, sound, and front podium access.",
    },
    {
      capacity: "90",
      availableFrom: "08:00",
      availableTo: "16:00",
      status: "ACTIVE",
      description: "Mid-size lecture space suited for daily academic sessions.",
    },
    {
      capacity: "150",
      availableFrom: "09:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "High-capacity hall with presentation support for major classes.",
    },
  ],
  LAB: [
    {
      capacity: "40",
      availableFrom: "08:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Practical lab with workstation seating and instructor console.",
    },
    {
      capacity: "30",
      availableFrom: "08:00",
      availableTo: "16:00",
      status: "ACTIVE",
      description: "Compact lab ideal for focused software or networking sessions.",
    },
    {
      capacity: "50",
      availableFrom: "09:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Shared teaching lab with strong power and connectivity coverage.",
    },
  ],
  MEETING_ROOM: [
    {
      capacity: "12",
      availableFrom: "08:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Small meeting room for staff briefings and project discussions.",
    },
    {
      capacity: "18",
      availableFrom: "08:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Discussion room with presentation screen and shared table space.",
    },
    {
      capacity: "24",
      availableFrom: "09:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Formal meeting room suited for reviews, planning, and workshops.",
    },
  ],
  EQUIPMENT: [
    {
      sharedResource: false,
      capacity: "1",
      availableFrom: "08:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Individual projector unit reserved through the resource desk.",
    },
    {
      sharedResource: false,
      capacity: "1",
      availableFrom: "08:00",
      availableTo: "17:00",
      status: "ACTIVE",
      description: "Individual camera kit for media capture and event documentation.",
    },
    {
      sharedResource: true,
      capacity: "4",
      availableFrom: "09:00",
      availableTo: "16:00",
      status: "ACTIVE",
      description: "Shared equipment pool with multiple bookable AV units for concurrent requests.",
    },
  ],
};

const emptyResourceForm = {
  name: "",
  type: "",
  capacity: "",
  sharedResource: false,
  location: "",
  availableFrom: "",
  availableTo: "",
  status: "",
  description: "",
};

export const initialFilters = {
  search: "",
  type: "",
  capacity: "",
  location: "",
  status: "",
};

export const formatEnumLabel = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") ?? "";

export const isSharedEquipmentResource = (resource) =>
  resource?.type === "EQUIPMENT" && (Boolean(resource?.sharedResource) || Number(resource?.capacity ?? 0) > 1);

export const getResourceCapacityLabel = (resource) => {
  const capacity = Number(resource?.capacity ?? 0);

  if (resource?.type === "EQUIPMENT") {
    return isSharedEquipmentResource(resource)
      ? `${capacity} units in shared pool`
      : "1 individually assigned unit";
  }

  return `${capacity} person capacity`;
};

export const getResourceAvailabilityLabel = (resource) => {
  if (resource?.status === "OUT_OF_SERVICE") {
    return "Currently unavailable";
  }

  if (resource?.type === "EQUIPMENT") {
    return isSharedEquipmentResource(resource)
      ? "Concurrent reservations allowed until all units are booked"
      : "Single active booking per time slot";
  }

  return "Single room reservation per time slot";
};

export const formatTimeLabel = (timeValue) =>
  timeValue
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(`1970-01-01T${timeValue}`))
    : "N/A";

export const formatCalendarDay = (date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

export const toDateKey = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const toTimeKey = (value) => String(value ?? "").slice(0, 5);

const isBookingActiveForAvailability = (booking) =>
  !["REJECTED", "CANCELLED"].includes(String(booking?.status ?? "").toUpperCase());

const doesBookingMatchResource = (booking, resource) =>
  (booking?.resourceId && booking.resourceId === resource.id) ||
  String(booking?.resourceName ?? "").trim().toLowerCase() === String(resource?.name ?? "").trim().toLowerCase();

const isBookingCoveringSlot = (booking, dayKey, slot) => {
  const bookingDay = String(booking?.date ?? "").slice(0, 10);
  const bookingStart = toTimeKey(booking?.startTime);
  const bookingEnd = toTimeKey(booking?.endTime);

  return bookingDay === dayKey && bookingStart <= slot && bookingEnd > slot;
};

const getOverlappingBookingCount = (bookings, resource, dayKey, slot) =>
  bookings.filter(
    (booking) =>
      isBookingActiveForAvailability(booking) &&
      doesBookingMatchResource(booking, resource) &&
      isBookingCoveringSlot(booking, dayKey, slot)
  ).length;

const getAllLocations = () => [...new Set(Object.values(campusLocations).flat())];

const getNextResourceSequence = (resources, type) => {
  const resourceCount = resources.filter((resource) => resource.type === type).length;
  return resourceCount + 1;
};

const buildSuggestedResourceDrafts = (type, resources, selectedLocation = "") => {
  if (!type) {
    return [];
  }

  const templates = resourceSuggestionTemplates[type] ?? [];
  const locations = [selectedLocation, ...(campusLocations[type] ?? [])].filter(Boolean);
  const uniqueLocations = [...new Set(locations)];
  const startIndex = getNextResourceSequence(resources, type);
  const nameBase = resourceNameBases[type] ?? "Resource";

  return templates.map((template, index) => ({
    ...template,
    name: `${nameBase} ${startIndex + index}`,
    type,
    location: uniqueLocations[index] ?? uniqueLocations[0] ?? "",
  }));
};

const normalizeResourceType = (value) => {
  const normalized = value.trim().toUpperCase().replaceAll(" ", "_").replaceAll("-", "_");
  const aliases = {
    LECTURE_HALL: "LECTURE_HALL",
    HALL: "LECTURE_HALL",
    LAB: "LAB",
    LABORATORY: "LAB",
    MEETING_ROOM: "MEETING_ROOM",
    MEETING: "MEETING_ROOM",
    EQUIPMENT: "EQUIPMENT",
    PROJECTOR: "EQUIPMENT",
    CAMERA: "EQUIPMENT",
  };

  return aliases[normalized] ?? "";
};

const normalizeStatus = (value) => value.trim().toUpperCase().replaceAll(" ", "_").replaceAll("-", "_");

const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
};

const parseCsvText = (csvText) => {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const getValue = (header) => {
      const headerIndex = headers.indexOf(header.toLowerCase());
      return headerIndex >= 0 ? cells[headerIndex]?.trim() ?? "" : "";
    };

    return {
      rowNumber: index + 2,
      raw: {
        name: getValue("Name"),
        type: getValue("Type"),
        capacity: getValue("Capacity"),
        location: getValue("Location"),
        availableFrom: getValue("Available From"),
        availableTo: getValue("Available To"),
        status: getValue("Status"),
        description: getValue("Description"),
      },
    };
  });
};

const buildDuplicateKey = (name, location) => `${name.trim().toLowerCase()}::${location.trim().toLowerCase()}`;

const getFriendlyResourceError = (err) => {
  const message = err?.response?.data?.message;
  if (message) {
    return message;
  }

  if (err?.response?.status === 403) {
    return "Only admin users can create, update, or delete resources.";
  }

  if (!err?.response) {
    return "Cannot reach the backend server. Please start the backend and try again.";
  }

  return "Something went wrong while saving the resource. Please try again.";
};

export const useResourcesModule = ({ initialSearch = "" } = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role) => String(role ?? "").trim().toUpperCase().replace(/^ROLE_/, ""))
    : [];
  const isAdmin = roles.some((role) => ["ADMIN", "MANAGER"].includes(role));
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");
  const [formState, setFormState] = useState(emptyResourceForm);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineFormState, setInlineFormState] = useState(emptyResourceForm);
  const [inlineFormErrors, setInlineFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({ ...initialFilters, search: initialSearch });
  const [availabilityResource, setAvailabilityResource] = useState(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvRows, setCsvRows] = useState([]);
  const [csvMessage, setCsvMessage] = useState("");
  const [importingBulk, setImportingBulk] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const csvInputRef = useRef(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setCatalogueError("");

    try {
      const { data } = await resourceApi.list();
      setResources(data ?? []);
    } catch {
      setResources([]);
      setCatalogueError("Unable to load the facilities catalogue right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      return;
    }

    try {
      const { data } = await bookingApi.availability();
      setBookings(data ?? []);
    } catch {
      setBookings([]);
    }
  }, [user]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const calendarDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date();
        day.setDate(day.getDate() + index);
        return day;
      }),
    []
  );

  const formLocationOptions = formState.type ? campusLocations[formState.type] ?? [] : [];
  const filterLocationOptions = filters.type ? campusLocations[filters.type] ?? [] : getAllLocations();
  const suggestedResourceDrafts = useMemo(
    () => buildSuggestedResourceDrafts(formState.type, resources, formState.location),
    [formState.location, formState.type, resources]
  );

  const filteredResources = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const minCapacity = filters.capacity === "" ? null : Number(filters.capacity);

    return resources.filter((resource) => {
      const matchesSearch =
        normalizedSearch === "" ||
        resource.name?.toLowerCase().includes(normalizedSearch) ||
        resource.location?.toLowerCase().includes(normalizedSearch) ||
        resource.description?.toLowerCase().includes(normalizedSearch);

      const matchesType = filters.type === "" || resource.type === filters.type;
      const matchesCapacity = minCapacity === null || (resource.capacity ?? 0) >= minCapacity;
      const matchesLocation = filters.location === "" || resource.location === filters.location;
      const matchesStatus = filters.status === "" || resource.status === filters.status;

      return matchesSearch && matchesType && matchesCapacity && matchesLocation && matchesStatus;
    });
  }, [filters, resources]);

  const summary = useMemo(
    () => ({
      total: resources.length,
      active: resources.filter((resource) => resource.status === "ACTIVE").length,
      outOfService: resources.filter((resource) => resource.status === "OUT_OF_SERVICE").length,
      filtered: filteredResources.length,
    }),
    [filteredResources.length, resources]
  );

  const resourceTypeSummary = useMemo(
    () => ({
      labs: resources.filter((resource) => resource.type === "LAB").length,
      rooms: resources.filter((resource) => ["LECTURE_HALL", "MEETING_ROOM"].includes(resource.type)).length,
      equipment: resources.filter((resource) => resource.type === "EQUIPMENT").length,
    }),
    [resources]
  );

  const recentlyAddedResources = useMemo(() => resources.slice(-5).reverse(), [resources]);
  const maintenanceResources = useMemo(
    () => resources.filter((resource) => resource.status === "OUT_OF_SERVICE").slice(0, 5),
    [resources]
  );

  const validateResourcePayload = (payload) => {
    const nextErrors = {};
    const name = payload.name.trim();
    const capacity = Number(payload.capacity);

    if (!name) {
      nextErrors.name = "Resource name is required.";
    } else if (name.length < 3) {
      nextErrors.name = "Resource name must be at least 3 characters.";
    } else if (name.length > 80) {
      nextErrors.name = "Resource name cannot exceed 80 characters.";
    }

      if (!payload.type) {
      nextErrors.type = "Resource type is required.";
    }

    if (payload.type === "EQUIPMENT" && !payload.sharedResource && payload.capacity !== "1" && capacity !== 1) {
      nextErrors.capacity = "Individual equipment must keep capacity at 1.";
    }

    if (payload.type === "EQUIPMENT" && payload.sharedResource && capacity <= 1) {
      nextErrors.capacity = "Shared equipment pools must have more than 1 unit.";
    }

    if (payload.capacity === "") {
      nextErrors.capacity = "Capacity is required.";
    } else if (!Number.isInteger(capacity) || capacity < 1) {
      nextErrors.capacity = "Capacity must be a whole number greater than 0.";
    } else if (capacity > 500) {
      nextErrors.capacity = "Capacity cannot exceed 500.";
    }

    if (!payload.location) {
      nextErrors.location = "Campus location is required.";
    }

    if (!payload.availableFrom) {
      nextErrors.availableFrom = "Available from time is required.";
    }

    if (!payload.availableTo) {
      nextErrors.availableTo = "Available to time is required.";
    }

    if (payload.availableFrom && payload.availableTo && payload.availableFrom >= payload.availableTo) {
      nextErrors.availableTo = "Available to time must be later than available from time.";
    }

    if (!payload.status) {
      nextErrors.status = "Status is required.";
    }

    if (payload.description.trim().length > 240) {
      nextErrors.description = "Description cannot exceed 240 characters.";
    }

    return nextErrors;
  };

  const validateForm = () => {
    const nextErrors = validateResourcePayload(formState);
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormState((current) => {
      if (name === "type") {
        return {
          ...current,
          type: value,
          location: "",
          sharedResource: value === "EQUIPMENT" ? current.sharedResource : false,
          capacity: value === "EQUIPMENT" && !current.sharedResource ? "1" : current.capacity,
        };
      }

      if (name === "sharedResource") {
        const nextSharedState = event.target.checked;
        return {
          ...current,
          sharedResource: nextSharedState,
          capacity: nextSharedState ? current.capacity === "1" || current.capacity === "" ? "2" : current.capacity : "1",
        };
      }

      return { ...current, [name]: value };
    });

    setFormErrors((current) => ({ ...current, [name]: "" }));
    setFormMessage("");
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => {
      if (name === "type") {
        return { ...current, type: value, location: "" };
      }

      return { ...current, [name]: value };
    });
  };

  const resetForm = () => {
    setFormState(emptyResourceForm);
    setFormErrors({});
    setFormMessage("");
    setEditingId(null);
  };

  const applySuggestedResource = (suggestion) => {
    setFormState((current) => ({
      ...current,
      name: suggestion.name,
      type: suggestion.type,
      capacity: suggestion.capacity,
      sharedResource: Boolean(suggestion.sharedResource),
      location: suggestion.location,
      availableFrom: suggestion.availableFrom,
      availableTo: suggestion.availableTo,
      status: suggestion.status,
      description: suggestion.description,
    }));
    setFormErrors({});
    setFormMessage("");
  };

  const startInlineEdit = (resource) => {
    setInlineEditingId(resource.id);
    setInlineFormState({
      name: resource.name ?? "",
      type: resource.type ?? "",
      capacity: resource.capacity?.toString() ?? "",
      sharedResource: Boolean(resource.sharedResource),
      location: resource.location ?? "",
      availableFrom: resource.availableFrom ?? "",
      availableTo: resource.availableTo ?? "",
      status: resource.status ?? "",
      description: resource.description ?? "",
    });
    setInlineFormErrors({});
    setFormMessage("");
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineFormState(emptyResourceForm);
    setInlineFormErrors({});
  };

  const handleInlineFormChange = (event) => {
    const { name, value } = event.target;

    setInlineFormState((current) => {
      if (name === "type") {
        return {
          ...current,
          type: value,
          location: "",
          sharedResource: value === "EQUIPMENT" ? current.sharedResource : false,
          capacity: value === "EQUIPMENT" && !current.sharedResource ? "1" : current.capacity,
        };
      }

      if (name === "sharedResource") {
        const nextSharedState = event.target.checked;
        return {
          ...current,
          sharedResource: nextSharedState,
          capacity: nextSharedState ? current.capacity === "1" || current.capacity === "" ? "2" : current.capacity : "1",
        };
      }

      return { ...current, [name]: value };
    });

    setInlineFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormMessage("");

    if (!validateForm()) {
      return;
    }

    const payload = {
      ...formState,
      name: formState.name.trim(),
      capacity: Number(formState.capacity),
      sharedResource: formState.type === "EQUIPMENT" && Boolean(formState.sharedResource),
      description: formState.description.trim(),
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await resourceApi.update(editingId, payload);
        setFormMessage("Resource updated successfully.");
      } else {
        await resourceApi.create(payload);
        setFormMessage("Resource added successfully.");
      }

      resetForm();
      await loadResources();
    } catch (err) {
      setFormMessage(getFriendlyResourceError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlineSubmit = async (resourceId) => {
    const nextErrors = validateResourcePayload(inlineFormState);
    setInlineFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setInlineSubmitting(true);
    setFormMessage("");

    try {
      await resourceApi.update(resourceId, {
        ...inlineFormState,
        name: inlineFormState.name.trim(),
        capacity: Number(inlineFormState.capacity),
        sharedResource: inlineFormState.type === "EQUIPMENT" && Boolean(inlineFormState.sharedResource),
        description: inlineFormState.description.trim(),
      });
      setFormMessage("Resource updated successfully.");
      cancelInlineEdit();
      await loadResources();
    } catch (err) {
      setFormMessage(getFriendlyResourceError(err));
    } finally {
      setInlineSubmitting(false);
    }
  };

  const deleteResource = async (resource) => {
    const confirmed = window.confirm(`Delete "${resource.name}" from the catalogue?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(resource.id);
    setFormMessage("");

    try {
      await resourceApi.remove(resource.id);
      if (editingId === resource.id) {
        resetForm();
      }
      await loadResources();
    } catch (err) {
      setFormMessage(getFriendlyResourceError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const getNextSlot = (slot) => {
    const slotIndex = calendarSlots.indexOf(slot);
    return calendarSlots[slotIndex + 1] ?? availabilityResource?.availableTo ?? "";
  };

  const handleBookResource = (resource, slotDetails = {}) => {
    navigate("/bookings", {
      state: {
        selectedResource: {
          id: resource.id,
          name: resource.name,
          type: resource.type,
          location: resource.location,
          availableFrom: resource.availableFrom,
          availableTo: resource.availableTo,
          capacity: resource.capacity,
          sharedResource: Boolean(resource.sharedResource),
          date: slotDetails.date ?? "",
          startTime: slotDetails.startTime ?? resource.availableFrom ?? "",
          endTime: slotDetails.endTime ?? resource.availableTo ?? "",
        },
      },
    });
  };

  const exportResourcesCsv = () => {
    const escapeCsvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      csvTemplateHeaders,
      ...filteredResources.map((resource) => [
        resource.name,
        formatEnumLabel(resource.type),
        resource.capacity,
        resource.location,
        resource.availableFrom,
        resource.availableTo,
        resource.status,
        resource.description ?? "",
      ]),
    ];
    const csvContent = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resources-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateImportRows = (rows) => {
    const existingKeys = new Set(resources.map((resource) => buildDuplicateKey(resource.name ?? "", resource.location ?? "")));
    const csvKeys = new Set();

    return rows.map((row) => {
      const errors = [];
      const normalizedType = normalizeResourceType(row.raw.type);
      const normalizedStatus = normalizeStatus(row.raw.status);
      const capacity = Number(row.raw.capacity);
      const duplicateKey = buildDuplicateKey(row.raw.name, row.raw.location);

      if (!row.raw.name.trim()) {
        errors.push("Name is required.");
      }

      if (!row.raw.type.trim()) {
        errors.push("Type is required.");
      } else if (!normalizedType) {
        errors.push("Type must be Lecture Hall, Lab, Meeting Room, Equipment, Projector, or Camera.");
      }

      if (!row.raw.capacity.trim()) {
        errors.push("Capacity is required.");
      } else if (!Number.isInteger(capacity) || capacity <= 0) {
        errors.push("Capacity must be greater than 0.");
      } else if (normalizedType === "EQUIPMENT" && capacity !== 1) {
        errors.push("Equipment CSV imports must use capacity 1 unless created as a shared pool from the form.");
      }

      if (!row.raw.location.trim()) {
        errors.push("Location is required.");
      }

      if (!row.raw.availableFrom.trim()) {
        errors.push("Available From is required.");
      }

      if (!row.raw.availableTo.trim()) {
        errors.push("Available To is required.");
      }

      if (row.raw.availableFrom && row.raw.availableTo && row.raw.availableFrom >= row.raw.availableTo) {
        errors.push("Available To must be later than Available From.");
      }

      if (!row.raw.status.trim()) {
        errors.push("Status is required.");
      } else if (!resourceStatuses.includes(normalizedStatus)) {
        errors.push("Status must be either ACTIVE or OUT_OF_SERVICE.");
      }

      const isDuplicate = duplicateKey !== "::" && (existingKeys.has(duplicateKey) || csvKeys.has(duplicateKey));
      if (duplicateKey !== "::") {
        csvKeys.add(duplicateKey);
      }

      return {
        ...row,
        data: {
          name: row.raw.name.trim(),
          type: normalizedType,
          capacity,
          sharedResource: false,
          location: row.raw.location.trim(),
          availableFrom: row.raw.availableFrom.trim(),
          availableTo: row.raw.availableTo.trim(),
          status: normalizedStatus,
          description: row.raw.description.trim(),
        },
        errors,
        isDuplicate,
      };
    });
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files?.[0];
    setCsvMessage("");
    setImportSummary(null);

    if (!file) {
      setCsvFileName("");
      setCsvRows([]);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvFileName(file.name);
      setCsvRows([]);
      setCsvMessage("Please upload a valid .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsvText(String(reader.result ?? ""));
        const validatedRows = validateImportRows(rows);
        setCsvFileName(file.name);
        setCsvRows(validatedRows);
        setCsvMessage(
          rows.length === 0
            ? "No data rows found in the CSV file."
            : "CSV preview ready. Review the rows, then confirm or cancel the import."
        );
      } catch {
        setCsvRows([]);
        setCsvMessage("Unable to parse the CSV file. Please check the format and try again.");
      }
    };
    reader.onerror = () => {
      setCsvRows([]);
      setCsvMessage("Unable to read the CSV file. Please try again.");
    };
    reader.readAsText(file);
  };

  const downloadCsvTemplate = () => {
    const sampleRows = [
      csvTemplateHeaders.join(","),
      [
        "Main Lecture Hall A",
        "Lecture Hall",
        "120",
        "Main Building - Lecture Hall A",
        "08:00",
        "18:00",
        "ACTIVE",
        "Large lecture hall with projector and sound system",
      ].join(","),
      [
        "Projector X200",
        "Projector",
        "1",
        "Media Unit - Asset Room",
        "08:30",
        "16:30",
        "OUT_OF_SERVICE",
        "Portable projector currently under maintenance",
      ].join(","),
    ];
    const blob = new Blob([sampleRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resource-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importValidCsvRows = async () => {
    const validRows = csvRows.filter((row) => row.errors.length === 0 && !row.isDuplicate);
    const duplicateRows = csvRows.filter((row) => row.isDuplicate);
    const invalidRows = csvRows.filter((row) => row.errors.length > 0);

    if (validRows.length === 0) {
      setImportSummary({
        totalRows: csvRows.length,
        successfulImports: 0,
        skippedDuplicates: duplicateRows.length,
        invalidRows: invalidRows.length,
      });
      setCsvMessage("No valid rows available to import.");
      return;
    }

    setImportingBulk(true);
    setCsvMessage("");

    let successfulImports = 0;
    let failedImports = 0;

    for (const row of validRows) {
      try {
        await resourceApi.create(row.data);
        successfulImports += 1;
      } catch {
        failedImports += 1;
      }
    }

    setImportSummary({
      totalRows: csvRows.length,
      successfulImports,
      skippedDuplicates: duplicateRows.length,
      invalidRows: invalidRows.length + failedImports,
    });
    setCsvMessage(
      failedImports > 0
        ? `${successfulImports} resources imported. ${failedImports} rows failed during server import.`
        : `Import completed. Total rows: ${csvRows.length}. Imported: ${successfulImports}. Skipped: ${
            duplicateRows.length + invalidRows.length
          }.`
    );
    setCsvRows([]);
    setCsvFileName("");
    if (csvInputRef.current) {
      csvInputRef.current.value = "";
    }
    setImportingBulk(false);
    await loadResources();
  };

  const cancelImport = () => {
    setCsvRows([]);
    setCsvFileName("");
    setCsvMessage("Import cancelled. No resources were saved.");
    setImportSummary(null);

    if (csvInputRef.current) {
      csvInputRef.current.value = "";
    }
  };

  const getSlotMeta = (resource, day, slot) => {
    if (resource.status === "OUT_OF_SERVICE") {
      return { status: "Out of Service", detail: "Resource unavailable" };
    }

    const isInsideAvailability =
      resource.availableFrom && resource.availableTo && slot >= resource.availableFrom && slot < resource.availableTo;

    if (!isInsideAvailability) {
      return { status: "Out of Service", detail: "Outside operating hours" };
    }

    const dayKey = toDateKey(day);
    const overlappingBookings = getOverlappingBookingCount(bookings, resource, dayKey, slot);

    if (isSharedEquipmentResource(resource)) {
      const totalUnits = Math.max(Number(resource.capacity ?? 1), 1);
      const remainingUnits = Math.max(totalUnits - overlappingBookings, 0);

      if (remainingUnits === 0) {
        return { status: "Fully Booked", detail: `${totalUnits}/${totalUnits} units reserved` };
      }

      if (overlappingBookings > 0) {
        return { status: "Limited", detail: `${remainingUnits} of ${totalUnits} units available` };
      }
    }

    return overlappingBookings > 0
      ? { status: "Booked", detail: "This time slot is already reserved" }
      : { status: "Available", detail: getResourceAvailabilityLabel(resource) };
  };

  const getSlotStatus = (resource, day, slot) => getSlotMeta(resource, day, slot).status;

  const getSlotClass = (status) => {
    if (status === "Available") {
      return "border-green-200 bg-green-50 text-green-800";
    }

    if (status === "Booked" || status === "Limited") {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }

    return "border-red-200 bg-red-50 text-red-800";
  };

  return {
    isAdmin,
    resources,
    bookings,
    loading,
    catalogueError,
    loadResources,
    loadBookings,
    summary,
    resourceTypeSummary,
    recentlyAddedResources,
    maintenanceResources,
    formState,
    formErrors,
    formMessage,
    editingId,
    submitting,
    formLocationOptions,
    suggestedResourceDrafts,
    handleFormChange,
    handleSubmit,
    resetForm,
    applySuggestedResource,
    inlineEditingId,
    inlineFormState,
    inlineFormErrors,
    inlineSubmitting,
    startInlineEdit,
    cancelInlineEdit,
    handleInlineFormChange,
    handleInlineSubmit,
    deletingId,
    deleteResource,
    filters,
    setFilters,
    filterLocationOptions,
    handleFilterChange,
    clearFilters,
    filteredResources,
    exportResourcesCsv,
    csvInputRef,
    csvFileName,
    csvRows,
    csvMessage,
    importingBulk,
    importSummary,
    handleCsvUpload,
    downloadCsvTemplate,
    importValidCsvRows,
    cancelImport,
    availabilityResource,
    setAvailabilityResource,
    calendarDays,
    getSlotMeta,
    getSlotStatus,
    getSlotClass,
    getNextSlot,
    handleBookResource,
  };
};
