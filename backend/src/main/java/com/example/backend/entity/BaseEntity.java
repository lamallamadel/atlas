package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@MappedSuperclass
@FilterDef(
    name = "orgIdFilter",
    parameters = @ParamDef(name = "orgId", type = String.class)
)
public abstract class BaseEntity {

    @Column(name = "org_id", nullable = false, updatable = false)
    private String orgId;

    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
}
