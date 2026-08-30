(function(){
  "use strict";

  function toast(msg){ if (window.HubShell) HubShell.toast(msg); else alert(msg); }

  async function importPackInteractive(){
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return toast('Aucun fichier sélectionné.');
      var r = new FileReader();
      r.onload = function () {
        try {
          var obj = JSON.parse(r.result);
          if (!obj.id) return toast('Pack invalide : champ id manquant.');
          var arr = [];
          try { arr = JSON.parse(localStorage.getItem('curios_custom_packs') || '[]'); } catch(e) { arr = []; }
          var i = arr.findIndex(function(x){return x.id === obj.id;});
          if (i >= 0) arr[i] = obj; else arr.push(obj);
          localStorage.setItem('curios_custom_packs', JSON.stringify(arr));
          toast('Pack importé localement : ' + obj.id);
          if (window.HubShell) HubShell.navigate('catalogue');
        } catch (err) { toast('Impossible de lire le pack (JSON invalide).'); }
      };
      r.readAsText(f, 'utf-8');
    });
    input.click();
  }

  function hubAction_import_pack(){ importPackInteractive(); }
  function hubAction_new_projet(){ if (window.HubShell) HubShell.navigate('projets'); }
  function hubAction_new_parcours(){ if (window.HubShell) HubShell.navigate('parcours'); }
  function hubAction_new_client(){ if (window.HubShell) HubShell.navigate('clients'); }
  function hubAction_new_materiel(){ if (window.HubShell) HubShell.navigate('materiel'); }
  function hubAction_save_settings(){ toast('Paramètres enregistrés (simulé).'); }

  // expose expected names (data-page-action uses dashed names)
  // also expose dashed versions to match data-page-action attribute names
  window['hubAction_import-pack'] = hubAction_import_pack;

  // For convenience expose common variants
  window['hubAction_new-projet'] = hubAction_new_projet;
  window['hubAction_new-parcours'] = hubAction_new_parcours;
  window['hubAction_new-client'] = hubAction_new_client;
  window['hubAction_new-materiel'] = hubAction_new_materiel;
  window['hubAction_save-settings'] = hubAction_save_settings;

})();