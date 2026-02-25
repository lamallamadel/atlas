-- Seed default appointment reminder template for WhatsApp
-- This template uses variable interpolation: {{clientName}}, {{dateStr}}, {{timeStr}}, {{location}}, {{agentName}}

INSERT INTO whatsapp_template (
    org_id,
    name,
    language,
    category,
    status,
    components,
    description,
    current_version,
    created_at,
    updated_at
) VALUES (
    'default',
    'appointment_reminder',
    'fr',
    'TRANSACTIONAL',
    'ACTIVE',
    CAST('[
        {
            "type": "BODY",
            "text": "Bonjour {{clientName}}, nous vous rappelons votre rendez-vous prévu le {{dateStr}} à {{timeStr}} pour la visite {{location}}. Votre agent {{agentName}} sera sur place."
        }
    ]' AS ${json_type}),
    'Template par défaut pour les rappels de rendez-vous avec support multi-canal',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (org_id, name, language) DO NOTHING;

-- Seed template variables for appointment_reminder template
INSERT INTO template_variable (
    org_id,
    template_id,
    variable_name,
    component_type,
    position,
    example_value,
    description,
    is_required,
    created_at,
    updated_at
)
SELECT 
    'default',
    t.id,
    'clientName',
    'BODY',
    1,
    'Monsieur Dupont',
    'Nom du client',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM whatsapp_template t
WHERE t.org_id = 'default' AND t.name = 'appointment_reminder' AND t.language = 'fr'
ON CONFLICT DO NOTHING;

INSERT INTO template_variable (
    org_id,
    template_id,
    variable_name,
    component_type,
    position,
    example_value,
    description,
    is_required,
    created_at,
    updated_at
)
SELECT 
    'default',
    t.id,
    'dateStr',
    'BODY',
    2,
    '15/12/2024',
    'Date du rendez-vous au format dd/MM/yyyy',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM whatsapp_template t
WHERE t.org_id = 'default' AND t.name = 'appointment_reminder' AND t.language = 'fr'
ON CONFLICT DO NOTHING;

INSERT INTO template_variable (
    org_id,
    template_id,
    variable_name,
    component_type,
    position,
    example_value,
    description,
    is_required,
    created_at,
    updated_at
)
SELECT 
    'default',
    t.id,
    'timeStr',
    'BODY',
    3,
    '14:30',
    'Heure du rendez-vous au format HH:mm',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM whatsapp_template t
WHERE t.org_id = 'default' AND t.name = 'appointment_reminder' AND t.language = 'fr'
ON CONFLICT DO NOTHING;

INSERT INTO template_variable (
    org_id,
    template_id,
    variable_name,
    component_type,
    position,
    example_value,
    description,
    is_required,
    created_at,
    updated_at
)
SELECT 
    'default',
    t.id,
    'location',
    'BODY',
    4,
    '123 Rue de la Paix, Paris',
    'Lieu du rendez-vous',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM whatsapp_template t
WHERE t.org_id = 'default' AND t.name = 'appointment_reminder' AND t.language = 'fr'
ON CONFLICT DO NOTHING;

INSERT INTO template_variable (
    org_id,
    template_id,
    variable_name,
    component_type,
    position,
    example_value,
    description,
    is_required,
    created_at,
    updated_at
)
SELECT 
    'default',
    t.id,
    'agentName',
    'BODY',
    5,
    'Jean Martin',
    'Nom de l''agent',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM whatsapp_template t
WHERE t.org_id = 'default' AND t.name = 'appointment_reminder' AND t.language = 'fr'
ON CONFLICT DO NOTHING;
