package com.example.backend.repository;

import com.example.backend.entity.TemplateVariable;
import com.example.backend.entity.enums.ComponentType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TemplateVariableRepository extends JpaRepository<TemplateVariable, Long> {

    List<TemplateVariable> findByTemplateIdOrderByPositionAsc(Long templateId);

    List<TemplateVariable> findByTemplateIdAndComponentTypeOrderByPositionAsc(
            Long templateId, ComponentType componentType);

    void deleteByTemplateId(Long templateId);
}
