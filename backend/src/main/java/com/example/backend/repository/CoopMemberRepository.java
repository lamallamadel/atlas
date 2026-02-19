package com.example.backend.repository;

import com.example.backend.entity.CoopMember;
import com.example.backend.entity.enums.MemberStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CoopMemberRepository
        extends JpaRepository<CoopMember, Long>, JpaSpecificationExecutor<CoopMember> {

    Optional<CoopMember> findByIdAndOrgId(Long id, String orgId);

    Page<CoopMember> findByGroupIdAndOrgId(Long groupId, String orgId, Pageable pageable);

    Page<CoopMember> findByStatusAndOrgId(MemberStatus status, String orgId, Pageable pageable);

    Optional<CoopMember> findByMemberNumber(String memberNumber);
}
