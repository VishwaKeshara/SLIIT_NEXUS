import ResourcesPageShell from "../ResourcesPageShell";
import { useResourcesModule } from "../useResourcesModule.jsx";

const BulkImportPageView = () => {
  const {
    csvFileName,
    csvInputRef,
    csvMessage,
    csvRows,
    downloadCsvTemplate,
    handleCsvUpload,
    importSummary,
    importingBulk,
    importValidCsvRows,
    cancelImport,
  } = useResourcesModule();

  return (
    <ResourcesPageShell
      subtitle="Upload a CSV file, preview all rows, then confirm valid non-duplicate resource imports."
      title="Bulk Import Resources"
    >
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
              <p className="mt-2 font-display text-3xl font-extrabold text-green-900">{importSummary.successfulImports}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-700">Skipped Duplicates</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-amber-900">{importSummary.skippedDuplicates}</p>
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
                                {[...row.errors, row.isDuplicate ? "Duplicate name and location." : ""].filter(Boolean).join(" ")}
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
    </ResourcesPageShell>
  );
};

export default BulkImportPageView;
