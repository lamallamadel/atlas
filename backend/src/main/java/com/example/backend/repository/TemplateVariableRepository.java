package com.example.backend.repository;

import com.example.backend.entity.TemplateVariable;
import com.example.backend.entity.enums.ComponentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateVariableRepository extends JpaRepository<TemplateVariable, Long> {

    List<TemplateVariable> findByTemplateIdOrderByPositionAsc(Long templateId);

    List<TemplateVariable> findByTemplateIdAndComponentTypeOrderByPositionAsc(Long templateId, ComponentType componentType);

    void deleteByTemplateId(Long templateId);
}
