import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { CatalogItemDialog, type CatalogItemSubmission } from '../components/CatalogItemDialog'
import {
  addCustomMaintenanceItemToCatalog,
  deleteMaintenanceItemFromCatalog,
  getMaintenanceItemCatalog,
  MaintenanceItemCatalogRepositoryError,
  updateMaintenanceItemInCatalog,
} from '../maintenanceItemCatalog.repository'
import type { MaintenanceItemDefinition } from '../maintenanceItem.types'
import styles from './MaintenanceCatalogPage.module.css'

export function MaintenanceCatalogPage() {
  const [items, setItems] = useState<MaintenanceItemDefinition[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MaintenanceItemDefinition | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [itemToDelete, setItemToDelete] = useState<MaintenanceItemDefinition | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    getMaintenanceItemCatalog()
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof MaintenanceItemCatalogRepositoryError ? err.message : 'Could not load the maintenance checklist.')
        setItems([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  function openAddDialog() {
    setEditingItem(null)
    setDialogKey((prev) => prev + 1)
    setIsDialogOpen(true)
  }

  function openEditDialog(item: MaintenanceItemDefinition) {
    setEditingItem(item)
    setDialogKey((prev) => prev + 1)
    setIsDialogOpen(true)
  }

  async function handleDialogSubmit(submission: CatalogItemSubmission) {
    if (editingItem) {
      const updated = await updateMaintenanceItemInCatalog(editingItem.id, submission)
      setItems((prev) => (prev ?? []).map((item) => (item.id === updated.id ? updated : item)))
    } else {
      const created = await addCustomMaintenanceItemToCatalog(submission)
      setItems((prev) => [...(prev ?? []), created])
    }
  }

  async function handleConfirmDelete() {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await deleteMaintenanceItemFromCatalog(itemToDelete.id)
      setItems((prev) => (prev ?? []).filter((item) => item.id !== itemToDelete.id))
      setItemToDelete(null)
    } catch (err) {
      setError(err instanceof MaintenanceItemCatalogRepositoryError ? err.message : 'Could not delete this maintenance item.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/settings" className={styles.backLink}>
        ‹ Settings
      </Link>

      <div className={styles.header}>
        <h1>Maintenance Item Catalog</h1>
        {items !== null && items.length > 0 && (
          <button type="button" className={styles.addButton} onClick={openAddDialog}>
            + Add item
          </button>
        )}
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {items === null && !error && <LoadingState label="Loading catalog…" />}

      {items !== null && items.length === 0 && (
        <EmptyState
          title="No maintenance items yet"
          message="Add your first maintenance item to build your checklist."
          action={
            <button type="button" className={styles.addButton} onClick={openAddDialog}>
              + Add item
            </button>
          }
        />
      )}

      {items !== null && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <span className={styles.name}>{item.name}</span>
                {item.reminderEnabled && item.intervalKm !== undefined && (
                  <span className={styles.hint}>Every {item.intervalKm.toLocaleString()} km</span>
                )}
              </div>
              <div className={styles.cardActions}>
                <button type="button" className={styles.editButton} onClick={() => openEditDialog(item)}>
                  Edit
                </button>
                <button type="button" className={styles.deleteButton} onClick={() => setItemToDelete(item)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CatalogItemDialog
        key={dialogKey}
        open={isDialogOpen}
        initialItem={editingItem}
        onSubmit={handleDialogSubmit}
        onClose={() => setIsDialogOpen(false)}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        title="Delete this maintenance item?"
        message="This maintenance item will be removed from your checklist. Existing maintenance records that used it are not affected."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
