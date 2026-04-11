import { useSearchParams } from "react-router-dom";
import AvailabilityCalendarModal from "../availability/AvailabilityCalendarModal";
import ResourcesPageShell from "../ResourcesPageShell";
import { useResourcesModule } from "../useResourcesModule.jsx";
import ResourceCatalogueSection from "./ResourceCatalogueSection";

const ResourcesListPageView = ({ mode = "resources" }) => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const resourcesModule = useResourcesModule({ initialSearch });

  return (
    <ResourcesPageShell
      subtitle={
        mode === "availability"
          ? "Open weekly availability calendars and check resource status before booking."
          : "Search, filter, view, update, and remove campus resources from the catalogue."
      }
      title={mode === "availability" ? "Resource Availability" : "Resource Catalogue"}
    >
      <ResourceCatalogueSection activeMode={mode} {...resourcesModule} />
      <AvailabilityCalendarModal
        availabilityResource={resourcesModule.availabilityResource}
        calendarDays={resourcesModule.calendarDays}
        getNextSlot={resourcesModule.getNextSlot}
        getSlotClass={resourcesModule.getSlotClass}
        getSlotMeta={resourcesModule.getSlotMeta}
        getSlotStatus={resourcesModule.getSlotStatus}
        handleBookResource={resourcesModule.handleBookResource}
        onClose={() => resourcesModule.setAvailabilityResource(null)}
      />
    </ResourcesPageShell>
  );
};

export default ResourcesListPageView;
