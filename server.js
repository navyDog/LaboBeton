app.delete('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
  try {
    // 1. Extraction et Casting explicite (Coupe le Taint Tracking sur l'objet req)
    const rawId = req.params.id;
    const cleanId = String(rawId);

    // 2. Validation stricte du format avant toute requête DB
    if (!cleanId || cleanId.trim().length < 10) {
        return res.status(400).json({ message: "Format d'ID invalide" });
    }

    // 3. Construction manuelle de l'objet de requête (Isolation totale)
    const deleteQuery = { 
        _id: cleanId, 
        userId: req.user.id 
    };

    const deleted = await ConcreteTest.findOneAndDelete(deleteQuery);
    
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id }).lean();
    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
        specimenTypes: ['Cylindrique 16x32', 'Cylindrique 11x22', 'Cubique 15x15', 'Cubique 10x10'],
        deliveryMethods: ['Toupie', 'Benne', 'Mixer', 'Sur site'],
        manufacturingPlaces: ['Centrale BPE', 'Centrale Chantier', 'Préfabrication'],
        mixTypes: ['CEM II/A-LL 42.5N - 350kg', 'Béton B25 - Gravillon 20mm', 'Béton Hydrofuge - 400kg'],
        concreteClasses: ['C20/25', 'C25/30', 'C30/37', 'C35/45', 'C40/50', 'C45/55', 'C50/60'],
        consistencyClasses: ['S1', 'S2', 'S3', 'S4', 'S5'],
        curingMethods: ['Eau 20°C +/- 2°C', 'Salle Humide', 'Air ambiant', 'Isolant'],
        testTypes: ['Compression', 'Fendage', 'Flexion'],
        preparations: ['Surfaçage Soufre', 'Rectification', 'Boîte à Sable', 'Aucune'],
        nfStandards: ['NF EN 206/CN', 'NF EN 12350', 'NF EN 12390']
      });
      await settings.save();
    }
    res.json(settings);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    // WHITE-LISTING STRICT : On ne passe JAMAIS req.body directement à Mongoose
    // On définit explicitement les champs autorisés (Tableaux de Strings)
    const allowedArrays = [
        'specimenTypes', 'deliveryMethods', 'manufacturingPlaces', 'mixTypes',
        'concreteClasses', 'consistencyClasses', 'curingMethods', 'testTypes',
        'preparations', 'nfStandards'
    ];

    const updates = {};
    
    // On itère uniquement sur la liste blanche
    allowedArrays.forEach(field => {
        // On vérifie si le champ est présent et si c'est bien un tableau
        if (req.body[field] !== undefined && Array.isArray(req.body[field])) {
            // Casting de chaque élément du tableau en String pour éviter l'injection d'objets
            updates[field] = req.body[field].map(item => String(item));
        }
    });

    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates }, // Utilisation explicite de l'opérateur $set avec l'objet nettoyé
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  } catch (error) { res.status(500).json({ message: "Erreur sauvegarde" }); }
});