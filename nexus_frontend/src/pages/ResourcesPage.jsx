import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingApi, resourceApi } from "../services/api";

const resourceTypes = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const resourceStatuses = ["ACTIVE", "OUT_OF_SERVICE"];
const calendarSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const csvTemplateHeaders = [
  "Name",
  "Type",
  "Capacity",
  "Location",
  "Available From",
  "Available To",
  "Status",
  "Description",
];

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
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) {
        setBookings([]);
        return;
      }

      try {
        const { data } = await bookingApi.list();
        setBookings(data ?? []);
      } catch {
        setBookings([]);
      }
    };

    void loadBookings();
  }, [user]);

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

  const startEdit = (resource) => {
    setEditingId(resource.id);
    setFormState({
      name: resource.name ?? "",
      type: resource.type ?? "",
      capacity: resource.capacity?.toString() ?? "",
      location: resource.location ?? "",
      availableFrom: resource.availableFrom ?? "",
      availableTo: resource.availableTo ?? "",
      status: resource.status ?? "",
      description: resource.description ?? "",
    });
    setFormErrors({});
    setFormMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <main className="min-h-screen bg-[#edf4fb] pt-24">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-8 px-4 pb-16 lg:flex-row lg:items-start lg:px-6">
        <aside className="sticky top-24 rounded-[1.8rem] bg-[#103c35] p-6 text-white shadow-[0_28px_80px_rgba(16,60,53,0.28)] lg:min-h-[calc(100vh-8rem)] lg:w-80 lg:shrink-0">
          <div className="flex items-center gap-4 border-b border-white/15 pb-7">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-[#f2d45c] text-2xl font-black tracking-[0.12em] text-[#103c35]">
              NX
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold tracking-[-0.06em]">SLIIT Nexus</p>
              <p className="text-base font-medium tracking-[0.08em] text-[#d5efe6]">Module A</p>
            </div>
          </div>

          <nav className="mt-7 grid gap-4 text-base font-extrabold">
            <button
              type="button"
              onClick={() => setActivePanel("dashboard")}
              className={`rounded-[1.15rem] px-5 py-4 text-left text-white transition ${
                activePanel === "dashboard" ? "bg-white/24" : "bg-white/12 hover:bg-white/18"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("resources")}
              className={`rounded-[1.15rem] px-5 py-4 text-left text-white transition ${
                activePanel === "resources" ? "bg-white/24" : "bg-white/12 hover:bg-white/18"
              }`}
            >
              Resources
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePanel("add")}
                className={`rounded-[1.15rem] px-5 py-4 text-left text-white transition ${
                  activePanel === "add" ? "bg-white/24" : "bg-white/12 hover:bg-white/18"
                }`}
              >
                Add Resource
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePanel("import")}
                className={`rounded-[1.15rem] px-5 py-4 text-left text-white transition ${
                  activePanel === "import" ? "bg-white/24" : "bg-white/12 hover:bg-white/18"
                }`}
              >
                Bulk Import
              </button>
            )}
            <button
              type="button"
              onClick={() => setActivePanel("availability")}
              className={`rounded-[1.15rem] px-5 py-4 text-left text-white transition ${
                activePanel === "availability" ? "bg-white/24" : "bg-white/12 hover:bg-white/18"
              }`}
            >
              Availability
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 rounded-[1.15rem] bg-[#f2d45c] px-5 py-4 text-left text-base font-black text-[#103c35] transition hover:bg-[#f7df76]"
            >
              Logout
            </button>
          </nav>

          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-5">
            <p className="font-display text-2xl font-extrabold tracking-[-0.04em]">Admin Flow</p>
            <p className="mt-3 text-sm leading-6 text-[#d7eee6]">
              Manage resources, imports, and availability without leaving this dashboard.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
        <header id="dashboard" className="p-1 text-slate-900">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#39766a]">Smart Campus Operations Hub</p>
              <h1 className="font-display mt-3 text-5xl font-extrabold tracking-[-0.07em] text-[#0f342e] sm:text-6xl">
                {panelTitle}
              </h1>
              <p className="mt-3 max-w-3xl text-base font-semibold text-slate-500 sm:text-lg">
                {panelSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setActivePanel("dashboard")}
                className={`rounded-[1.35rem] px-7 py-4 text-base font-black shadow-[0_12px_28px_rgba(15,52,46,0.08)] ${
                  activePanel === "dashboard" ? "bg-[#f2d45c] text-[#103c35]" : "bg-white text-[#0f342e]"
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("resources")}
                className={`rounded-[1.35rem] px-7 py-4 text-base font-black shadow-[0_12px_28px_rgba(16,60,53,0.1)] ${
                  activePanel === "resources" ? "bg-[#f2d45c] text-[#103c35]" : "bg-white text-[#0f342e]"
                }`}
              >
                Resources
              </button>
            </div>
          </div>
        </header>

        {activePanel === "dashboard" && (
        <div className="mt-9 grid gap-6 md:grid-cols-4">
          <div className="rounded-[1.8rem] bg-white p-7 shadow-[0_18px_42px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-base font-extrabold text-[#5b7493]">Total Resources</p>
            <p className="mt-6 font-display text-5xl font-extrabold text-[#0f342e]">{summary.total}</p>
          </div>
          <div className="rounded-[1.8rem] bg-white p-7 shadow-[0_18px_42px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-base font-extrabold text-[#5b7493]">Active</p>
            <p className="mt-6 font-display text-5xl font-extrabold text-[#0f342e]">{summary.active}</p>
          </div>
          <div className="rounded-[1.8rem] bg-white p-7 shadow-[0_18px_42px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-base font-extrabold text-[#5b7493]">Out of Service</p>
            <p className="mt-6 font-display text-5xl font-extrabold text-[#0f342e]">{summary.outOfService}</p>
          </div>
          <div className="rounded-[1.8rem] bg-white p-7 shadow-[0_18px_42px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-base font-extrabold text-[#5b7493]">Filtered Results</p>
            <p className="mt-6 font-display text-5xl font-extrabold text-[#0f342e]">{summary.filtered}</p>
          </div>
        </div>
        )}

        {isAdmin && activePanel === "import" && (
          <section id="bulk-import" className="mt-9 rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Bulk Import</p>
                <h2 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
                  Bulk Import Resources
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
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
                <span className="text-sm font-bold text-slate-700">CSV File</span>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-800 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Required columns: Name, Type, Capacity, Location, Available From, Available To, Status, Description.
                </p>
              </label>
            </div>

            {(csvFileName || csvMessage) && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {csvFileName && <span className="mr-2 text-slate-900">Selected: {csvFileName}</span>}
                {csvMessage}
              </div>
            )}

            {importSummary && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">Total Rows</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-slate-900">{importSummary.totalRows}</p>
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
                <div className="overflow-hidden rounded-[1.4rem] border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {csvRows.map((row) => {
                          const isValid = row.errors.length === 0 && !row.isDuplicate;
                          const statusLabel = row.errors.length > 0 ? "Invalid" : row.isDuplicate ? "Duplicate" : "Ready";

                          return (
                            <tr
                              key={`${row.rowNumber}-${row.raw.name}-${row.raw.location}`}
                              className={isValid ? "" : row.isDuplicate ? "bg-amber-50/60" : "bg-red-50/60"}
                            >
                              <td className="px-4 py-3 font-bold text-slate-700">{row.rowNumber}</td>
                              <td className="px-4 py-3 text-slate-700">{row.raw.name || "-"}</td>
                              <td className="px-4 py-3 text-slate-700">{row.raw.type || "-"}</td>
                              <td className="px-4 py-3 text-slate-700">{row.raw.capacity || "-"}</td>
                              <td className="px-4 py-3 text-slate-700">{row.raw.location || "-"}</td>
                              <td className="px-4 py-3 text-slate-700">
                                {row.raw.availableFrom || "-"} - {row.raw.availableTo || "-"}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{row.raw.status || "-"}</td>
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
                    className="rounded-xl bg-slate-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel Import
                  </button>
                  <button
                    type="button"
                    onClick={importValidCsvRows}
                    disabled={importingBulk || csvRows.filter((row) => row.errors.length === 0 && !row.isDuplicate).length === 0}
                    className="rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
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
            <section id="add-resource" className="rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8 xl:col-span-2">
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
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Resource Name</span>
                  <input
                    name="name"
                    value={formState.name}
                    onChange={handleFormChange}
                    placeholder="Enter resource name"
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                      formErrors.name ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  {formErrors.name && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.name}</p>}
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Resource Type</span>
                    <select
                      name="type"
                      value={formState.type}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.type ? "border-red-400" : "border-slate-300 focus:border-blue-500"
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
                    <span className="text-sm font-bold text-slate-700">Capacity</span>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      value={formState.capacity}
                      onChange={handleFormChange}
                      placeholder="Enter capacity"
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.capacity ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.capacity && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.capacity}</p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Campus Location</span>
                  <select
                    name="location"
                    value={formState.location}
                    onChange={handleFormChange}
                    disabled={!formState.type}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 ${
                      formErrors.location ? "border-red-400" : "border-slate-300 focus:border-blue-500"
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
                  <p className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
                    Location list updates automatically based on the selected resource type.
                  </p>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Available From</span>
                    <input
                      name="availableFrom"
                      type="time"
                      value={formState.availableFrom}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.availableFrom ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.availableFrom && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableFrom}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Available To</span>
                    <input
                      name="availableTo"
                      type="time"
                      value={formState.availableTo}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.availableTo ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.availableTo && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableTo}</p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Status</span>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleFormChange}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                      formErrors.status ? "border-red-400" : "border-slate-300 focus:border-blue-500"
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

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Description</span>
                  <textarea
                    name="description"
                    rows="3"
                    value={formState.description}
                    onChange={handleFormChange}
                    placeholder="Enter short description"
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                      formErrors.description ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.description}</p>
                  )}
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : editingId ? "Update Resource" : "Save Resource"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl bg-slate-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                  >
                    Clear
                  </button>
                </div>

                {formMessage && (
                  <p
                    className={`rounded-xl px-4 py-3 text-sm font-bold ${
                      formMessage.toLowerCase().includes("success")
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {formMessage}
                  </p>
                )}

                <p className="text-sm leading-6 text-slate-600">
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 xl:col-span-2"
              />

              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2 xl:col-span-5"
              >
                <option value="">All Locations</option>
                {filterLocationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl bg-slate-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Reset Filters
              </button>
            </div>

            <div id="availability" className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              Use the `View Availability` button on any resource card to open the weekly availability calendar.
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-8 text-center font-semibold text-slate-500">
                  Loading resources...
                </div>
              ) : catalogueError ? (
                <div className="rounded-[1.4rem] border border-red-200 bg-red-50 p-8 text-center font-semibold text-red-700">
                  {catalogueError}
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-8 text-center font-semibold text-slate-500">
                  No resources found.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredResources.map((resource) => (
                    <article
                      key={resource.id}
                      className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-900">
                            {resource.name}
                          </h3>
                          <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                            {formatEnumLabel(resource.type)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                            resource.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {resource.status}
                        </span>
                      </div>

                      <div className="mt-5 space-y-2 text-sm text-slate-700">
                        <p>
                          <span className="font-bold text-slate-900">Capacity:</span> {resource.capacity}
                        </p>
                        <p>
                          <span className="font-bold text-slate-900">Location:</span> {resource.location}
                        </p>
                        <p>
                          <span className="font-bold text-slate-900">Availability:</span>{" "}
                          {formatTimeLabel(resource.availableFrom)} - {formatTimeLabel(resource.availableTo)}
                        </p>
                        <p>
                          <span className="font-bold text-slate-900">Description:</span>{" "}
                          {resource.description || "N/A"}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setAvailabilityResource(resource)}
                          className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1d4ed8]"
                        >
                          View Availability
                        </button>
                      </div>

                      {isAdmin && (
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(resource)}
                            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteResource(resource)}
                            disabled={deletingId === resource.id}
                            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === resource.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
          )}
        </div>
        )}
      </section>
      </div>

      {availabilityResource && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] p-6 text-white">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
                  Resource Availability Calendar
                </p>
                <h2 className="font-display mt-2 text-3xl font-extrabold tracking-[-0.04em]">
                  {availabilityResource.name}
                </h2>
                <p className="mt-2 text-sm font-semibold text-blue-100">
                  {formatEnumLabel(availabilityResource.type)} | {availabilityResource.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvailabilityResource(null)}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-[#1e3a8a] transition hover:bg-blue-50"
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

              <div className="overflow-x-auto rounded-[1.4rem] border border-slate-200">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[120px_repeat(7,1fr)] bg-slate-100">
                    <div className="border-r border-slate-200 p-3 text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                      Time
                    </div>
                    {calendarDays.map((day) => (
                      <div
                        key={toDateKey(day)}
                        className="border-r border-slate-200 p-3 text-center text-sm font-black text-slate-700 last:border-r-0"
                      >
                        {formatCalendarDay(day)}
                      </div>
                    ))}
                  </div>

                  {calendarSlots.map((slot) => (
                    <div key={slot} className="grid grid-cols-[120px_repeat(7,1fr)] border-t border-slate-200">
                      <div className="border-r border-slate-200 bg-slate-50 p-3 text-sm font-extrabold text-slate-700">
                        {formatTimeLabel(slot)}
                      </div>
                      {calendarDays.map((day) => {
                        const status = getSlotStatus(availabilityResource, day, slot);

                        return (
                          <div key={`${toDateKey(day)}-${slot}`} className="border-r border-slate-200 p-2 last:border-r-0">
                            <div className={`rounded-xl border px-3 py-3 text-center text-xs font-black ${getSlotClass(status)}`}>
                              {status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Booked slots are matched from approved booking records for this resource. Other slots follow the
                resource availability window.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default ResourcesPage;
