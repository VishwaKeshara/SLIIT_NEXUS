package com.sliit.nexus.dto;

import com.sliit.nexus.enums.ResourceStatus;
import com.sliit.nexus.enums.ResourceType;
import java.time.LocalTime;

public class ResourceResponseDTO {

    private String id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private ResourceStatus status;
    private String description;

    // getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

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
