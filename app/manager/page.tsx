'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// --- Interfaces ---
interface Expense {
  id: number
  created_at: string
  title: string
  amount: number
  status: string
  user_id: string
  receipt_url?: string
}

interface PurchaseOrder {
  id: number
  created_at: string
  vendor_name: string
  item_details: string
  total_cost: number
  status: string
  requester_id: string
}

export default function ManagerDashboard() {
  // State
  const [activeTab, setActiveTab] = useState<'expenses' | 'pos'>('expenses')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string>('') // Store who is logged in

  // Initial Data Fetch
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Get Current User Role
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setCurrentUserRole(profile?.role || 'employee')
    }
    
    // 2. Fetch Expenses
    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    
    // 3. Fetch Purchase Orders
    const { data: poData } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (expData) setExpenses(expData)
    if (poData) setPurchaseOrders(poData)
    
    setLoading(false)
  }

  // --- THE CORE STATE MACHINE LOGIC ---
  const handleExpenseApproval = async (expense: Expense) => {
    let nextStatus = 'approved' // Default goal

    // Logic for MANAGER
    if (currentUserRole === 'manager') {
      if (expense.amount > 20) {
        nextStatus = 'pending_finance' // Pass baton to Finance
      } else {
        nextStatus = 'approved' // Fully approved
      }
    }
    // Logic for FINANCE
    else if (currentUserRole === 'finance') {
      if (expense.amount > 50) {
        nextStatus = 'pending_president' // Pass baton to President
      } else {
        nextStatus = 'approved' // Fully approved
      }
    }
    // Logic for PRESIDENT
    else if (currentUserRole === 'president') {
      nextStatus = 'approved'
    }

    // Update Database
    const { error } = await supabase
      .from('expenses')
      .update({ status: nextStatus })
      .eq('id', expense.id)

    if (!error) {
      // Update UI immediately
      setExpenses(prev => prev.map(e => 
        e.id === expense.id ? { ...e, status: nextStatus } : e
      ))
      alert(`Status updated to: ${nextStatus.replace(/_/g, ' ').toUpperCase()}`)
    } else {
      alert('Error updating status')
    }
  }

  // Handle Expense Rejection
  const handleExpenseRejection = async (expense: Expense) => {
    const { error } = await supabase
      .from('expenses')
      .update({ status: 'rejected' })
      .eq('id', expense.id)

    if (!error) {
      setExpenses(prev => prev.map(e => 
        e.id === expense.id ? { ...e, status: 'rejected' } : e
      ))
      alert('Expense rejected')
    } else {
      alert('Error rejecting expense')
    }
  }

  // Helper: Can the current user act on this expense?
  const canAct = (status: string) => {
    // Note: older items might just say 'pending', treat them as 'pending_manager'
    if (status === 'pending' && currentUserRole === 'manager') return true
    if (status === 'pending_manager' && currentUserRole === 'manager') return true
    if (status === 'pending_finance' && currentUserRole === 'finance') return true
    if (status === 'pending_president' && currentUserRole === 'president') return true
    return false
  }

  // --- PO APPROVAL LOGIC (Same state machine as expenses) ---
  const handlePOApproval = async (po: PurchaseOrder) => {
    let nextStatus = 'approved' // Default goal

    // Logic for MANAGER
    if (currentUserRole === 'manager') {
      if (po.total_cost > 20) {
        nextStatus = 'pending_finance' // Pass to Finance
      } else {
        nextStatus = 'approved' // Auto-approve if small
      }
    }
    // Logic for FINANCE
    else if (currentUserRole === 'finance') {
      if (po.total_cost > 50) {
        nextStatus = 'pending_president' // Pass to President
      } else {
        nextStatus = 'approved' // Auto-approve if mid-sized
      }
    }
    // Logic for PRESIDENT
    else if (currentUserRole === 'president') {
      nextStatus = 'approved'
    }

    // Update Database
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: nextStatus })
      .eq('id', po.id)

    if (!error) {
      setPurchaseOrders(prev => prev.map(p => 
        p.id === po.id ? { ...p, status: nextStatus } : p
      ))
      alert(`PO Status updated to: ${nextStatus.replace(/_/g, ' ').toUpperCase()}`)
    } else {
      alert('Error updating PO status')
    }
  }

  // Handle PO Rejection
  const handlePORejection = async (po: PurchaseOrder) => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'rejected' })
      .eq('id', po.id)

    if (!error) {
      setPurchaseOrders(prev => prev.map(p => 
        p.id === po.id ? { ...p, status: 'rejected' } : p
      ))
      alert('PO rejected')
    } else {
      alert('Error rejecting PO')
    }
  }

  // Helper for status badges with support for new states
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      pending_manager: 'bg-yellow-100 text-yellow-800',
      pending_finance: 'bg-orange-100 text-orange-800',
      pending_president: 'bg-purple-100 text-purple-800',
    }
    const colorClass = colors[status] || 'bg-gray-100 text-gray-800'
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    )
  }

  // Count pending items that the current user can act on
  const getPendingExpenseCount = () => {
    return expenses.filter(e => canAct(e.status)).length
  }

  const getPendingPOCount = () => {
    return purchaseOrders.filter(po => canAct(po.status)).length
  }

  if (loading) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Approval Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Logged in as: <span className="font-bold uppercase text-blue-600">{currentUserRole || 'Loading...'}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2 px-4 ${activeTab === 'expenses' 
            ? 'border-b-2 border-blue-500 text-blue-600 font-bold' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Expense Claims ({getPendingExpenseCount()} actionable)
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`pb-2 px-4 ${activeTab === 'pos' 
            ? 'border-b-2 border-green-500 text-green-600 font-bold' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Purchase Orders ({getPendingPOCount()} actionable)
        </button>
      </div>

      {/* --- EXPENSES TABLE --- */}
      {activeTab === 'expenses' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(exp.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{exp.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">${exp.amount.toFixed(2)}</td>
                  <td className="px-6 py-4"><StatusBadge status={exp.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {exp.receipt_url ? (
                      <a 
                        href={exp.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">No receipt</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {canAct(exp.status) ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleExpenseApproval(exp)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleExpenseRejection(exp)}
                          className="bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {exp.status === 'approved' ? 'Completed' : exp.status === 'rejected' ? 'Rejected' : 'Waiting for others'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && <div className="p-8 text-center text-gray-500">No expenses found.</div>}
        </div>
      )}

      {/* --- PURCHASE ORDERS TABLE --- */}
      {activeTab === 'pos' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(po.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{po.vendor_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={po.item_details}>
                    {po.item_details}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">${po.total_cost.toFixed(2)}</td>
                  <td className="px-6 py-4"><StatusBadge status={po.status} /></td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {canAct(po.status) ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePOApproval(po)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handlePORejection(po)}
                          className="bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {po.status === 'approved' ? 'Completed' : po.status === 'rejected' ? 'Rejected' : 'Waiting for others'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchaseOrders.length === 0 && <div className="p-8 text-center text-gray-500">No purchase orders found.</div>}
        </div>
      )}
    </div>
  )
}
