package com.sliit.nexus.repository;

import com.sliit.nexus.model.SupportTicket;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SupportTicketRepository extends MongoRepository<SupportTicket, String> {
    List<SupportTicket> findByCreatedByUserIdOrderByCreatedAtDesc(String createdByUserId);
}
