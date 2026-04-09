package com.sliit.nexus.controller;

import com.sliit.nexus.dto.ResourceRequestDTO;
import com.sliit.nexus.dto.ResourceResponseDTO;
import com.sliit.nexus.service.ResourceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public List<ResourceResponseDTO> list() {
        return resourceService.list();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponseDTO create(@Valid @RequestBody ResourceRequestDTO request) {
        return resourceService.create(request);
    }
}
