package com.sliit.nexus.dto;

import com.sliit.nexus.enums.ResourceStatus;
import com.sliit.nexus.enums.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public class ResourceRequestDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private Boolean sharedResource;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Available from is required")
    private LocalTime availableFrom;

    @NotNull(message = "Available to is required")
    private LocalTime availableTo;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    private String description;

    // getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Boolean getSharedResource() { return sharedResource; }
    public void setSharedResource(Boolean sharedResource) { this.sharedResource = sharedResource; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalTime getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(LocalTime availableFrom) { this.availableFrom = availableFrom; }

    public LocalTime getAvailableTo() { return availableTo; }
    public void setAvailableTo(LocalTime availableTo) { this.availableTo = availableTo; }

    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
