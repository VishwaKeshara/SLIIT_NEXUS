package com.sliit.nexus.service;

import com.sliit.nexus.dto.ResourceRequestDTO;
import com.sliit.nexus.dto.ResourceResponseDTO;
import com.sliit.nexus.model.Resource;
import com.sliit.nexus.repository.ResourceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceResponseDTO create(ResourceRequestDTO request) {
        validateAvailabilityWindow(request);

        Resource resource = new Resource();
        applyRequest(resource, request);

        Resource saved = resourceRepository.save(resource);
        return toResponse(saved);
    }

    public List<ResourceResponseDTO> list() {
        return resourceRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateAvailabilityWindow(ResourceRequestDTO request) {
        if (!request.getAvailableFrom().isBefore(request.getAvailableTo())) {
            throw new IllegalArgumentException("Available from time must be before available to time.");
        }
    }

    private void applyRequest(Resource resource, ResourceRequestDTO request) {
        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation());
        resource.setAvailableFrom(request.getAvailableFrom());
        resource.setAvailableTo(request.getAvailableTo());
        resource.setStatus(request.getStatus());
        resource.setDescription(request.getDescription());
    }

    private ResourceResponseDTO toResponse(Resource resource) {
        ResourceResponseDTO response = new ResourceResponseDTO();
        response.setId(resource.getId());
        response.setName(resource.getName());
        response.setType(resource.getType());
        response.setCapacity(resource.getCapacity());
        response.setLocation(resource.getLocation());
        response.setAvailableFrom(resource.getAvailableFrom());
        response.setAvailableTo(resource.getAvailableTo());
        response.setStatus(resource.getStatus());
        response.setDescription(resource.getDescription());
        return response;
    }
}
