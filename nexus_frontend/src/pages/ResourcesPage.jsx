import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingApi, resourceApi } from "../services/api";

const resourceTypeOptions = [
  "ALL",
  "LECTURE_HALL",
  "LAB",
  "MEETING_ROOM",
  "EQUIPMENT",
];
const resourceStatusOptions = ["ALL", "ACTIVE", "OUT_OF_SERVICE"];

const campusLocations = {
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

const emptyResourceForm = {
  name: "",
  type: "",
  capacity: "",
  location: "",
  availableFrom: "",
  availableTo: "",
  status: "",
  description: "",
};

const initialFilters = {
  search: "",
  type: "",
  capacity: "",
  location: "",
  status: "",
};

const formatEnumLabel = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") ?? "";

const formatTimeLabel = (timeValue) =>
  timeValue
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(`1970-01-01T${timeValue}`))
    : "N/A";

const formatCalendarDay = (date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

const toDateKey = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const getAllLocations = () => [...new Set(Object.values(campusLocations).flat())];

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

const ResourcesPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.roles?.includes("ADMIN");

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
  const [filters, setFilters] = useState(initialFilters);
  const [availabilityResource, setAvailabilityResource] = useState(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvRows, setCsvRows] = useState([]);
  const [csvMessage, setCsvMessage] = useState("");
  const [importingBulk, setImportingBulk] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [activePanel, setActivePanel] = useState("dashboard");
  const csvInputRef = useRef(null);

  const loadResources = async () => {
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
  };

  useEffect(() => {
    void loadResources();
  }, []);

  const locationOptions = useMemo(() => {
    const locations = [
      ...new Set(
        resources.map((resource) => resource.location).filter(Boolean),
      ),
    ];
    return ["ALL", ...locations];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const capacityThreshold =
      minimumCapacity === "" ? null : Number(minimumCapacity);

    return resources.filter((resource) => {
      const matchesSearch =
        normalizedSearch === "" ||
        resource.name?.toLowerCase().includes(normalizedSearch) ||
        resource.location?.toLowerCase().includes(normalizedSearch) ||
        resource.description?.toLowerCase().includes(normalizedSearch);

      const matchesType =
        selectedType === "ALL" || resource.type === selectedType;
      const matchesStatus =
        selectedStatus === "ALL" || resource.status === selectedStatus;
      const matchesLocation =
        selectedLocation === "ALL" || resource.location === selectedLocation;
      const matchesCapacity =
        capacityThreshold === null ||
        (resource.capacity ?? 0) >= capacityThreshold;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesLocation &&
        matchesCapacity
      );
    });
  }, [
    minimumCapacity,
    resources,
    searchText,
    selectedLocation,
    selectedStatus,
    selectedType,
  ]);

  const summary = useMemo(
    () => ({
      total: resources.length,
      active: resources.filter((resource) => resource.status === "ACTIVE")
        .length,
      outOfService: resources.filter(
        (resource) => resource.status === "OUT_OF_SERVICE",
      ).length,
      filtered: filteredResources.length,
    }),
    [filteredResources.length, resources],
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

  const validateForm = () => {
    const nextErrors = {};
    const name = formState.name.trim();
    const capacity = Number(formState.capacity);

    if (!name) {
      nextErrors.name = "Resource name is required.";
    } else if (name.length < 3) {
      nextErrors.name = "Resource name must be at least 3 characters.";
    } else if (name.length > 80) {
      nextErrors.name = "Resource name cannot exceed 80 characters.";
    }

    if (!formState.type) {
      nextErrors.type = "Resource type is required.";
    }

    if (formState.capacity === "") {
      nextErrors.capacity = "Capacity is required.";
    } else if (!Number.isInteger(capacity) || capacity < 1) {
      nextErrors.capacity = "Capacity must be a whole number greater than 0.";
    } else if (capacity > 500) {
      nextErrors.capacity = "Capacity cannot exceed 500.";
    }

    if (!formState.location) {
      nextErrors.location = "Campus location is required.";
    }

    if (!formState.availableFrom) {
      nextErrors.availableFrom = "Available from time is required.";
    }

    if (!formState.availableTo) {
      nextErrors.availableTo = "Available to time is required.";
    }

    if (formState.availableFrom && formState.availableTo && formState.availableFrom >= formState.availableTo) {
      nextErrors.availableTo = "Available to time must be later than available from time.";
    }

    if (!formState.status) {
      nextErrors.status = "Status is required.";
    }

    if (formState.description.trim().length > 240) {
      nextErrors.description = "Description cannot exceed 240 characters.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormState((current) => {
      if (name === "type") {
        return { ...current, type: value, location: "" };
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

  const startInlineEdit = (resource) => {
    setInlineEditingId(resource.id);
    setInlineFormState({
      name: resource.name ?? "",
      type: resource.type ?? "",
      capacity: resource.capacity?.toString() ?? "",
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
        return { ...current, type: value, location: "" };
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
    } catch {
      setFormMessage(
        "Failed to create the resource. Please check the values and try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const panelTitle =
    {
      dashboard: "Resource Management Dashboard",
      resources: "Resource Catalogue",
      add: editingId ? "Edit Resource" : "Add Resource",
      import: "Bulk Import Resources",
      availability: "Resource Availability",
    }[activePanel] ?? "Resource Management Dashboard";

  const panelSubtitle =
    {
      dashboard: "Manage facilities, assets, imports, availability, and operational status from one admin workspace.",
      resources: "Search, filter, view, update, and remove campus resources from the catalogue.",
      add: "Create a new resource or update the selected resource with validated campus data.",
      import: "Upload a CSV file, preview all rows, then confirm valid non-duplicate resource imports.",
      availability: "Open weekly availability calendars and check resource status before booking.",
    }[activePanel] ?? "";

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

      const data = {
        name: row.raw.name.trim(),
        type: normalizedType,
        capacity,
        location: row.raw.location.trim(),
        availableFrom: row.raw.availableFrom.trim(),
        availableTo: row.raw.availableTo.trim(),
        status: normalizedStatus,
        description: row.raw.description.trim(),
      };

      return {
        ...row,
        data,
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

  const getSlotStatus = (resource, day, slot) => {
    if (resource.status === "OUT_OF_SERVICE") {
      return "Out of Service";
    }

    const isInsideAvailability =
      resource.availableFrom && resource.availableTo && slot >= resource.availableFrom && slot < resource.availableTo;

    if (!isInsideAvailability) {
      return "Out of Service";
    }

    const dayKey = toDateKey(day);
    const slotLabel = formatTimeLabel(slot);
    const isBooked = bookings.some(
      (booking) =>
        booking.status === "APPROVED" &&
        booking.resourceName === resource.name &&
        booking.dateLabel?.includes(dayKey) &&
        booking.dateLabel?.includes(slotLabel)
    );

    return isBooked ? "Booked" : "Available";
  };

  const getSlotClass = (status) => {
    if (status === "Available") {
      return "border-green-200 bg-green-50 text-green-800";
    }

    if (status === "Booked") {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }

    return "border-red-200 bg-red-50 text-red-800";
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3fbf8_0%,#eef7f3_100%)] px-4 pb-16 pt-28">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-[#b9ddd2] bg-[linear-gradient(135deg,#0b3a34,#19584c_60%,#2d7f6b)] p-8 text-white shadow-[0_24px_70px_rgba(6,35,33,0.16)]">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfe8db]">
            Module A
          </p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            Facilities & Assets Catalogue
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#e1f3ec] sm:text-lg">
            Browse lecture halls, labs, meeting rooms, and equipment with
            searchable metadata including type, capacity, location, availability
            window, and operational status.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">
                Total Resources
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                {summary.total}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">Active</p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                {summary.active}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">Out of Service</p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                {summary.outOfService}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">
                Filtered Results
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                {summary.filtered}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-9 rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2d7f6b]">
                Search & Filter
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#062321]">
                Find the right campus resource
              </h2>
            </div>
            <span className="rounded-[1.2rem] bg-[#f3f8f5] px-5 py-3 text-sm font-black text-[#39766a]">
              {summary.filtered} current results
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePanel("add")}
                className="rounded-[1.4rem] bg-[#f2d45c] p-5 text-center text-[#103c35] shadow-[0_14px_34px_rgba(16,60,53,0.1)] transition hover:-translate-y-1"
              >
                <p className="text-xl font-extrabold">Add Resource</p>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePanel("import")}
                className="rounded-[1.4rem] bg-white p-5 text-center text-[#0f342e] shadow-sm ring-1 ring-[#dbe7df] transition hover:-translate-y-1"
              >
                <p className="text-xl font-extrabold">Bulk Import</p>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActivePanel("availability")}
              className="rounded-[1.4rem] bg-[#103c35] p-5 text-center text-white shadow-[0_14px_34px_rgba(16,60,53,0.18)] transition hover:-translate-y-1"
            >
              <p className="text-xl font-extrabold">View Availability</p>
            </button>

            <button
              type="button"
              onClick={exportResourcesCsv}
              className="rounded-[1.4rem] bg-white p-5 text-center text-[#0f342e] shadow-sm ring-1 ring-[#dbe7df] transition hover:-translate-y-1"
            >
              <p className="text-xl font-extrabold">Export CSV</p>
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-[1.4rem] bg-white p-5 text-center text-[#0f342e] shadow-sm ring-1 ring-[#dbe7df] transition hover:-translate-y-1"
            >
              <p className="text-xl font-extrabold">Reset Filters</p>
            </button>
          </div>
        </section>

        <section className="mt-9 grid gap-6 xl:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Recently Added</p>
            <h3 className="font-display mt-2 text-3xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
              Recent Resources
            </h3>
            <div className="mt-5 space-y-3">
              {recentlyAddedResources.length === 0 ? (
                <p className="rounded-[1rem] bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-[#5c746d]">
                  No resources yet.
                </p>
              ) : (
                recentlyAddedResources.map((resource) => (
                  <article key={resource.id} className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3">
                    <p className="font-extrabold text-[#0f342e]">{resource.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[#5c746d]">{formatEnumLabel(resource.type)}</p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Maintenance</p>
            <h3 className="font-display mt-2 text-3xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
              Needs Attention
            </h3>
            <div className="mt-5 space-y-3">
              {maintenanceResources.length === 0 ? (
                <p className="rounded-[1rem] bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-[#5c746d]">
                  No out-of-service resources.
                </p>
              ) : (
                maintenanceResources.map((resource) => (
                  <article key={resource.id} className="rounded-[1rem] border border-red-100 bg-red-50 px-4 py-3">
                    <p className="font-extrabold text-red-900">{resource.name}</p>
                    <p className="mt-1 text-sm font-semibold text-red-700">{resource.location}</p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Quick Search</p>
            <h3 className="font-display mt-2 text-3xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
              Find Resource
            </h3>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search name, location, description"
              className="mt-5 w-full rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
            />
            <button
              type="button"
              onClick={() => setActivePanel("resources")}
              className="mt-4 w-full rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2e29]"
            >
              View Results
            </button>
          </div>
        </section>
        </>
        )}

        {isAdmin && activePanel === "import" && (
          <section id="bulk-import" className="mt-9 rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Bulk Import</p>
                <h2 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
                  Bulk Import Resources
                </h2>
                <p className="mt-2 text-sm font-semibold text-[#5c746d]">
                  Upload a CSV file, review validation results, then import only valid non-duplicate rows.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="rounded-[1.2rem] border border-[#e6d577] bg-[#fff7cf] px-5 py-3 text-sm font-black text-[#5c4b06] transition hover:bg-[#fff0a8]"
              >
                Download CSV Template
              </button>
            </div>

            <div className="mt-6">
              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">CSV File</span>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-sm text-[#0f342e] outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[#fff7cf] file:px-4 file:py-2 file:font-bold file:text-[#5c4b06] hover:file:bg-[#fff0a8] focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                />
                <p className="mt-2 text-sm text-[#5c746d]">
                  Required columns: Name, Type, Capacity, Location, Available From, Available To, Status, Description.
                </p>
              </label>
            </div>

            {(csvFileName || csvMessage) && (
              <div className="mt-5 rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-sm font-semibold text-[#3e6259]">
                {csvFileName && <span className="mr-2 text-[#0f342e]">Selected: {csvFileName}</span>}
                {csvMessage}
              </div>
            )}

            {importSummary && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1rem] bg-[#f8fbf9] p-4">
                  <p className="text-sm font-bold text-[#5b7493]">Total Rows</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-[#0f342e]">{importSummary.totalRows}</p>
                </div>
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-sm font-bold text-green-700">Successful Imports</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-green-900">
                    {importSummary.successfulImports}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-700">Skipped Duplicates</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-amber-900">
                    {importSummary.skippedDuplicates}
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700">Invalid Rows</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-red-900">{importSummary.invalidRows}</p>
                </div>
              </div>
            )}

            {csvRows.length > 0 && (
              <div className="mt-6">
                <div className="overflow-hidden rounded-[1.4rem] border border-[#dbe7df]">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                      <thead className="bg-[#f3f8f5] text-xs font-black uppercase tracking-[0.12em] text-[#5b7493]">
                        <tr>
                          <th className="px-4 py-3">Row</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Capacity</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Available</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dbe7df] bg-white">
                        {csvRows.map((row) => {
                          const isValid = row.errors.length === 0 && !row.isDuplicate;
                          const statusLabel = row.errors.length > 0 ? "Invalid" : row.isDuplicate ? "Duplicate" : "Ready";

                          return (
                            <tr
                              key={`${row.rowNumber}-${row.raw.name}-${row.raw.location}`}
                              className={isValid ? "" : row.isDuplicate ? "bg-amber-50/60" : "bg-red-50/60"}
                            >
                              <td className="px-4 py-3 font-bold text-[#0f342e]">{row.rowNumber}</td>
                              <td className="px-4 py-3 text-[#3e6259]">{row.raw.name || "-"}</td>
                              <td className="px-4 py-3 text-[#3e6259]">{row.raw.type || "-"}</td>
                              <td className="px-4 py-3 text-[#3e6259]">{row.raw.capacity || "-"}</td>
                              <td className="px-4 py-3 text-[#3e6259]">{row.raw.location || "-"}</td>
                              <td className="px-4 py-3 text-[#3e6259]">
                                {row.raw.availableFrom || "-"} - {row.raw.availableTo || "-"}
                              </td>
                              <td className="px-4 py-3 text-[#3e6259]">{row.raw.status || "-"}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                                    isValid
                                      ? "bg-green-100 text-green-800"
                                      : row.isDuplicate && row.errors.length === 0
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                                {(row.errors.length > 0 || row.isDuplicate) && (
                                  <p className="mt-2 max-w-xs text-xs font-semibold leading-5 text-red-700">
                                    {[...row.errors, row.isDuplicate ? "Duplicate name and location." : ""]
                                      .filter(Boolean)
                                      .join(" ")}
                                  </p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelImport}
                    disabled={importingBulk}
                    className="rounded-[1rem] bg-[#6b7f78] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#52645f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel Import
                  </button>
                  <button
                    type="button"
                    onClick={importValidCsvRows}
                    disabled={importingBulk || csvRows.filter((row) => row.errors.length === 0 && !row.isDuplicate).length === 0}
                    className="rounded-[1rem] bg-[#103c35] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0b2e29] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importingBulk ? "Importing..." : "Confirm Import"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {["add", "resources", "availability"].includes(activePanel) && (
        <div className="mt-9 grid gap-6 xl:grid-cols-[0.9fr_1.7fr]">
          {isAdmin && activePanel === "add" && (
            <section id="add-resource" className="overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(226,241,235,0.5))] p-7 shadow-[0_24px_58px_rgba(15,52,46,0.14)] backdrop-blur-xl sm:p-8 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Admin Tool</p>
                  <h2 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
                    {editingId ? "Edit Resource" : "Add Resource"}
                  </h2>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-[1rem] bg-[#f3f8f5] px-4 py-2 text-sm font-bold text-[#0f342e] transition hover:bg-[#e6f0eb]"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form className="mt-6 rounded-[1.6rem] border border-white/80 bg-white/55 p-5 shadow-inner backdrop-blur-xl sm:p-6" onSubmit={handleSubmit} noValidate>
                <label className="block">
                  <span className="text-sm font-bold text-[#0f342e]">Resource Name</span>
                  <input
                    name="name"
                    value={formState.name}
                    onChange={handleFormChange}
                    placeholder="Enter resource name"
                    className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                      formErrors.name ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                    }`}
                  />
                  {formErrors.name && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.name}</p>}
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Resource Type</span>
                    <select
                      name="type"
                      value={formState.type}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                        formErrors.type ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                      }`}
                    >
                      <option value="">Select type</option>
                      {resourceTypes.map((type) => (
                        <option key={type} value={type}>
                          {formatEnumLabel(type)}
                        </option>
                      ))}
                    </select>
                    {formErrors.type && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.type}</p>}
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Capacity</span>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      value={formState.capacity}
                      onChange={handleFormChange}
                      placeholder="Enter capacity"
                      className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                        formErrors.capacity ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                      }`}
                    />
                    {formErrors.capacity && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.capacity}</p>
                    )}
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-bold text-[#0f342e]">Campus Location</span>
                  <select
                    name="location"
                    value={formState.location}
                    onChange={handleFormChange}
                    disabled={!formState.type}
                    className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] disabled:bg-[#eef3f0] ${
                      formErrors.location ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                    }`}
                  >
                    <option value="">{formState.type ? "Select campus location" : "Select resource type first"}</option>
                    {formLocationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  {formErrors.location && (
                    <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.location}</p>
                  )}
                  <p className="mt-2 rounded-[1rem] border border-[#dbe7df] bg-[#f3f8f5] px-3 py-2 text-sm font-semibold text-[#39766a]">
                    Location list updates automatically based on the selected resource type.
                  </p>
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Available From</span>
                    <input
                      name="availableFrom"
                      type="time"
                      value={formState.availableFrom}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                        formErrors.availableFrom ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                      }`}
                    />
                    {formErrors.availableFrom && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableFrom}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Available To</span>
                    <input
                      name="availableTo"
                      type="time"
                      value={formState.availableTo}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                        formErrors.availableTo ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                      }`}
                    />
                    {formErrors.availableTo && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableTo}</p>
                    )}
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-bold text-[#0f342e]">Status</span>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleFormChange}
                    className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                      formErrors.status ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                    }`}
                  >
                    <option value="">Select status</option>
                    {resourceStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {formErrors.status && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.status}</p>}
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-bold text-[#0f342e]">Description</span>
                  <textarea
                    name="description"
                    rows="3"
                    value={formState.description}
                    onChange={handleFormChange}
                    placeholder="Enter short description"
                    className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                      formErrors.description ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.description}</p>
                  )}
                </label>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2e29] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : editingId ? "Update Resource" : "Save Resource"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-[1rem] bg-[#6b7f78] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#52645f]"
                  >
                    Clear
                  </button>
                </div>

                {formMessage && (
                  <p
                    className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
                      formMessage.toLowerCase().includes("success")
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {formMessage}
                  </p>
                )}

                <p className="mt-4 text-sm leading-6 text-[#5c746d]">
                  This version uses predefined campus locations instead of manual typing.
                </p>
              </form>
            </section>
          )}

          {["resources", "availability"].includes(activePanel) && (
          <section id="resources" className="rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8 xl:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">
                  {activePanel === "availability" ? "Availability" : "Catalogue"}
                </p>
                <h2 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
                  {activePanel === "availability" ? "Resource Availability Calendar" : "Resource Catalogue"}
                </h2>
              </div>
              <button
                type="button"
                onClick={loadResources}
                className="rounded-[1.2rem] bg-[#eef3fb] px-5 py-3 text-sm font-black text-[#0f342e] shadow-sm transition hover:bg-[#e3edf8]"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input
                name="search"
                type="text"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name or location..."
                className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7] xl:col-span-2"
              />

              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
              >
                <option value="">All Types</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatEnumLabel(type)}
                  </option>
                ))}
              </select>

              <input
                name="capacity"
                type="number"
                min="1"
                value={filters.capacity}
                onChange={handleFilterChange}
                placeholder="Min Capacity"
                className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
              />

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
              >
                <option value="">All Status</option>
                {resourceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7] md:col-span-2 xl:col-span-5"
              >
                {resourceStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL"
                      ? "All Statuses"
                      : formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-[#1a4b43]">
                Min Capacity
              </span>
              <input
                type="number"
                min="0"
                value={minimumCapacity}
                onChange={(event) => setMinimumCapacity(event.target.value)}
                placeholder="e.g. 50"
                className="mt-2 w-full rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none transition focus:border-[#2d7f6b]"
              />
            </label>
          </div>
        </div>

        {isAdmin && (
          <section className="mt-8 rounded-[1.75rem] border border-[#cfe7df] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2d7f6b]">
                  Admin Tool
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#062321]">
                  Add a new resource to the catalogue
                </h2>
              </div>
              <p className="text-sm text-[#58726c]">
                Visible only to admin users because `POST /resources` is
                secured.
              </p>
            </div>

            <form
              className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              onSubmit={handleCreateResource}
            >
              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">
                  Resource Name
                </span>
                <input
                  required
                  name="name"
                  value={formState.name}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

                      <div className="mt-5 grid gap-3 text-sm text-[#3e6259]">
                        <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Capacity</p>
                          <p className="mt-1 font-extrabold text-[#0f342e]">{resource.capacity}</p>
                        </div>
                        <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Location</p>
                          <p className="mt-1 font-extrabold text-[#0f342e]">{resource.location}</p>
                        </div>
                        <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Availability</p>
                          <p className="mt-1 font-extrabold text-[#0f342e]">
                            {formatTimeLabel(resource.availableFrom)} - {formatTimeLabel(resource.availableTo)}
                          </p>
                        </div>
                        <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Description</p>
                          <p className="mt-1 font-semibold text-[#3e6259]">{resource.description || "N/A"}</p>
                        </div>
                      </div>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">
                  Capacity
                </span>
                <input
                  required
                  min="0"
                  type="number"
                  name="capacity"
                  value={formState.capacity}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">
                  Location
                </span>
                <input
                  required
                  name="location"
                  value={formState.location}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">
                  Available From
                </span>
                <input
                  required
                  type="time"
                  name="availableFrom"
                  value={formState.availableFrom}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">
                  Available To
                </span>
                <input
                  required
                  type="time"
                  name="availableTo"
                  value={formState.availableTo}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

                            <label className="block">
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">From</span>
                              <input
                                name="availableFrom"
                                type="time"
                                value={inlineFormState.availableFrom}
                                onChange={handleInlineFormChange}
                                className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                                  inlineFormErrors.availableFrom ? "border-red-400" : "border-[#dbe7df]"
                                }`}
                              />
                            </label>

              <label className="block md:col-span-2 xl:col-span-2">
                <span className="text-sm font-bold text-[#1a4b43]">
                  Description
                </span>
                <textarea
                  required
                  name="description"
                  value={formState.description}
                  onChange={handleFormChange}
                  rows="4"
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

                            <label className="block md:col-span-2">
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Status</span>
                              <select
                                name="status"
                                value={inlineFormState.status}
                                onChange={handleInlineFormChange}
                                className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                                  inlineFormErrors.status ? "border-red-400" : "border-[#dbe7df]"
                                }`}
                              >
                                <option value="">Select status</option>
                                {resourceStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block md:col-span-2">
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Description</span>
                              <textarea
                                name="description"
                                rows="3"
                                value={inlineFormState.description}
                                onChange={handleInlineFormChange}
                                className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                                  inlineFormErrors.description ? "border-red-400" : "border-[#dbe7df]"
                                }`}
                              />
                              {inlineFormErrors.description && (
                                <p className="mt-1 text-xs font-bold text-red-600">{inlineFormErrors.description}</p>
                              )}
                            </label>
                          </div>
                        </div>
                      )}

            {formMessage && (
              <p className="mt-4 text-sm font-semibold text-[#205d4f]">
                {formMessage}
              </p>
            )}
          </section>
          )}
        </div>
        )}
      </section>
      </div>

      {availabilityResource && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#08231f]/65 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dbe7df] bg-[#103c35] p-6 text-white">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d7eee6]">
                  Resource Availability Calendar
                </p>
                <h2 className="font-display mt-2 text-3xl font-extrabold tracking-[-0.04em]">
                  {availabilityResource.name}
                </h2>
                <p className="mt-2 text-sm font-semibold text-[#d7eee6]">
                  {formatEnumLabel(availabilityResource.type)} | {availabilityResource.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvailabilityResource(null)}
                className="rounded-full bg-[#f2d45c] px-5 py-2.5 text-sm font-extrabold text-[#103c35] transition hover:bg-[#f7df76]"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-132px)] overflow-y-auto p-6">
              {availabilityResource.status === "OUT_OF_SERVICE" && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                  This resource is currently OUT_OF_SERVICE. All calendar slots are blocked until the status changes.
                </div>
              )}

              <div className="mb-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
                  Available
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
                  Booked
                </span>
                <span className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-800">
                  Out of Service
                </span>
              </div>

              <div className="overflow-x-auto rounded-[1.4rem] border border-[#dbe7df]">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[120px_repeat(7,1fr)] bg-[#f3f8f5]">
                    <div className="border-r border-[#dbe7df] p-3 text-sm font-black uppercase tracking-[0.12em] text-[#5b7493]">
                      Time
                    </div>
                    {calendarDays.map((day) => (
                      <div
                        key={toDateKey(day)}
                        className="border-r border-[#dbe7df] p-3 text-center text-sm font-black text-[#0f342e] last:border-r-0"
                      >
                        {formatCalendarDay(day)}
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#4f6963]">
                    {resource.description}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#f3fbf8] p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f8f84]">
                        Location
                      </p>
                      <p className="mt-1 font-semibold text-[#133c35]">
                        {resource.location}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f3fbf8] p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f8f84]">
                        Capacity
                      </p>
                      <p className="mt-1 font-semibold text-[#133c35]">
                        {resource.capacity}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f3fbf8] p-3 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f8f84]">
                        Availability
                      </p>
                      <p className="mt-1 font-semibold text-[#133c35]">
                        {formatTimeLabel(resource.availableFrom)} -{" "}
                        {formatTimeLabel(resource.availableTo)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default ResourcesPage;
